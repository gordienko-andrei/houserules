import { parseForESLint } from '@angular-eslint/template-parser';
import type { RoleMapping } from '../config/schema';
import type { ScanReport } from '../scan/scan-project';

export type CheckStatus = 'ok' | 'warning' | 'error' | 'skipped';

export interface Check {
  readonly status: CheckStatus;
  readonly message: string;
}

const SAMPLE_EXPRESSION = 'order.total';

export function fillUsage(usage: string, expression: string = SAMPLE_EXPRESSION): string {
  return usage.split('$value').join(expression);
}

export function checkRoleTarget(roleName: string, role: RoleMapping, scan: ScanReport): Check {
  if (role.component !== undefined) {
    const facts = scan.components.find((component) => component.selector === role.component);
    if (facts === undefined || (facts.source === 'unknown' && facts.usage.count === 0)) {
      return { status: 'error', message: `${roleName}: <${role.component}> is not declared in the project or its libraries and is never used.` };
    }
    const origin = facts.source === 'unknown' ? 'declaration not found' : `${facts.source}${facts.declaredIn === undefined ? '' : `, ${facts.declaredIn}`}`;
    const deprecated = facts.isDeprecated ? ' It is marked @deprecated.' : '';
    return { status: facts.isDeprecated ? 'warning' : 'ok', message: `${roleName}: <${role.component}> found (${origin}), ${facts.usage.count} uses.${deprecated}` };
  }
  const facts = scan.pipes.find((pipe) => pipe.name === role.pipe);
  if (facts === undefined || (facts.source === 'unknown' && facts.count === 0)) {
    return { status: 'error', message: `${roleName}: pipe \`${role.pipe ?? ''}\` is not declared in the project or its libraries and is never used.` };
  }
  return { status: 'ok', message: `${roleName}: pipe \`${facts.name}\` found (${facts.source}), ${facts.count} uses.` };
}

export function checkUsageSyntax(roleName: string, role: RoleMapping): Check {
  try {
    parseForESLint(fillUsage(role.usage), { filePath: `${roleName}.usage.html` });
    return { status: 'ok', message: `${roleName}: usage is a valid template.` };
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
    return { status: 'error', message: `${roleName}: usage is not a valid template: ${reason}` };
  }
}

export function checkUsageCallsTarget(roleName: string, role: RoleMapping): Check {
  const callsTarget =
    role.component !== undefined
      ? role.usage.includes(`<${role.component}`)
      : new RegExp(`\\|\\s*${role.pipe ?? ''}\\b`).test(role.usage);
  const target = role.component === undefined ? `the \`${role.pipe ?? ''}\` pipe` : `<${role.component}>`;
  return callsTarget
    ? { status: 'ok', message: `${roleName}: usage calls ${target}.` }
    : { status: 'error', message: `${roleName}: usage does not call ${target}.` };
}

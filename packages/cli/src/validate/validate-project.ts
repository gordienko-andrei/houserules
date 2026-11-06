import { loadConfig, type LoadedConfig } from '../config/load-config';
import { resolveRules } from '../config/resolve-rules';
import { RULE_NAMES } from '../config/schema';
import { scanProject } from '../scan/scan-project';
import { checkRoleTarget, checkUsageCallsTarget, checkUsageSyntax, type Check } from './role-checks';
import { lintRoleUsage } from './self-lint';

function loadOrReport(root: string): LoadedConfig | Check {
  try {
    return loadConfig(root);
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

function ruleChecks(loaded: LoadedConfig): Check[] {
  const enabled = new Set(resolveRules(loaded.config).map((rule) => rule.name));
  return RULE_NAMES.map((name) =>
    enabled.has(name)
      ? { status: 'ok', message: `rule houserules/${name} is on.` }
      : { status: 'skipped', message: `rule houserules/${name} is off.` },
  );
}

export async function validateProject(root: string): Promise<Check[]> {
  const loaded = loadOrReport(root);
  if ('status' in loaded) {
    return [loaded];
  }
  const checks: Check[] = [{ status: 'ok', message: `config ${loaded.path} is valid.` }];
  const scan = scanProject(root, loaded.config.currencyWords);
  for (const [name, role] of Object.entries(loaded.config.roles)) {
    checks.push(checkRoleTarget(name, role, scan), checkUsageCallsTarget(name, role));
    const syntax = checkUsageSyntax(name, role);
    checks.push(syntax);
    if (syntax.status === 'ok') {
      checks.push(await lintRoleUsage(root, name, role.usage, loaded.config));
    }
  }
  return [...checks, ...ruleChecks(loaded)];
}

const STATUS_MARKS: Readonly<Record<Check['status'], string>> = {
  ok: '✔',
  warning: '!',
  error: '✖',
  skipped: '-',
};

export function formatChecks(checks: readonly Check[]): string {
  return checks.map((check) => `${STATUS_MARKS[check.status]} ${check.message}`).join('\n');
}

export function hasErrors(checks: readonly Check[]): boolean {
  return checks.some((check) => check.status === 'error');
}

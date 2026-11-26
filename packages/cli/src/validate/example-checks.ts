import { parseElementSelector, renderSampleElement } from '../config/element-selector';
import type { Restriction } from '../config/schema';
import type { ReplacementSummary } from '../scan/replacement-summary';
import type { Check } from './role-checks';
import type { LintMessage, PreparedLint } from './self-lint';

const REPLACEMENT_RULE = 'houserules/prefer-role-component';
const RESTRICTION_RULE = 'houserules/restricted-template-syntax';

function lintOrError(prepared: { readonly lint: (code: string, fileName: string) => LintMessage[] }, code: string, fileName: string): LintMessage[] | string {
  try {
    return prepared.lint(code, fileName);
  } catch (error) {
    return error instanceof Error ? error.message.split('\n')[0] ?? error.message : String(error);
  }
}

export function checkReplacementScan(roleName: string, summary: ReplacementSummary): Check {
  const examples = summary.examples.map((example) => `${example.file}:${example.line}`).join(', ');
  const reported = `${summary.reported} native element(s) to replace${examples === '' ? '' : ` (${examples})`}`;
  const directives = summary.directives.map((directive) => `${directive.name} on ${directive.count}`).join(', ');
  const skipped =
    summary.skipped === 0
      ? ''
      : `; ${summary.skipped} skipped because they carry directive attributes: ${directives} (one element may carry several)`;
  const undeclared = summary.undeclaredAttributes.map((name) => `\`${name}\``).join(', ');
  if (undeclared !== '') {
    return {
      status: 'warning',
      message: `${roleName}: replaces \`${summary.selector}\`: ${reported}${skipped}. No directive of the project or its libraries selects on ${undeclared}: if it is an input or a helper directive, add it to \`nonComponentAttributes\`.`,
    };
  }
  return { status: 'ok', message: `${roleName}: replaces \`${summary.selector}\`: ${reported}${skipped}.` };
}

export function checkReplacementExample(prepared: PreparedLint, roleName: string, selectorSource: string): Check {
  const selector = parseElementSelector(selectorSource);
  if ('unavailable' in prepared || selector === undefined) {
    return { status: 'skipped', message: `${roleName}: replaces \`${selectorSource}\` not linted.` };
  }
  const sample = renderSampleElement(selector);
  const messages = lintOrError(prepared, sample, `${roleName}.replaces.html`);
  if (typeof messages === 'string') return { status: 'error', message: `${roleName}: unable to lint \`${sample}\`: ${messages}` };
  return messages.some((message) => message.ruleId === REPLACEMENT_RULE)
    ? { status: 'ok', message: `${roleName}: \`${sample}\` is reported as a native element to replace.` }
    : { status: 'error', message: `${roleName}: \`${sample}\` matches \`${selectorSource}\` but is not reported. Check that prefer-role-component is on.` };
}

export function checkRestriction(prepared: PreparedLint, index: number, restriction: Restriction): Check[] {
  const name = `restriction ${index + 1} (\`${restriction.selector}\`)`;
  if ('unavailable' in prepared) return [{ status: prepared.unavailable, message: `${name}: examples not linted, ${prepared.reason}.` }];
  const bad = lintOrError(prepared, restriction.bad, `restriction-${index + 1}.bad.html`);
  if (typeof bad === 'string') return [{ status: 'error', message: `${name}: the selector or the bad example is invalid: ${bad}` }];
  const good = lintOrError(prepared, restriction.good, `restriction-${index + 1}.good.html`);
  if (typeof good === 'string') return [{ status: 'error', message: `${name}: the good example is invalid: ${good}` }];
  const isBadReported = bad.some((message) => message.ruleId === RESTRICTION_RULE && message.message === restriction.message);
  return [
    isBadReported
      ? { status: 'ok', message: `${name}: the bad example is reported.` }
      : { status: 'error', message: `${name}: the bad example is not reported, so the selector does not match it.` },
    good.length === 0
      ? { status: 'ok', message: `${name}: the good example passes Houserules rules.` }
      : { status: 'error', message: `${name}: the good example breaks rules: ${good.map((message) => message.message).join(' ')}` },
  ];
}

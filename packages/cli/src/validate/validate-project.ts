import { loadConfig, type LoadedConfig } from '../config/load-config';
import { resolveRules } from '../config/resolve-rules';
import { RULE_NAMES } from '../config/schema';
import { scanProject } from '../scan/scan-project';
import { checkRoleTarget, checkUsage, type Check } from './role-checks';
import { prepareRoleUsageLint } from './self-lint';

function loadOrReport(root: string): LoadedConfig | Check {
  try {
    return loadConfig(root);
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

function ruleChecks(loaded: LoadedConfig): Check[] {
  const enabled = new Map(resolveRules(loaded.config).map((rule) => [rule.name, rule.severity]));
  return RULE_NAMES.map((name) =>
    enabled.has(name)
      ? { status: 'ok', message: `rule houserules/${name} is on (${enabled.get(name)}).` }
      : { status: 'skipped', message: `rule houserules/${name} is off.` },
  );
}

export async function validateProject(root: string): Promise<Check[]> {
  const loaded = loadOrReport(root);
  if ('status' in loaded) {
    return [loaded];
  }
  const checks: Check[] = [{ status: 'ok', message: `config ${loaded.path} is valid.` }];
  const roles = Object.values(loaded.config.roles);
  let scan;
  try {
    scan = scanProject(root, loaded.config.currencyWords, {
      roots: loaded.config.scan?.roots,
      components: roles.flatMap((role) => role.component === undefined ? [] : [role.component]),
      pipes: roles.flatMap((role) => role.pipe === undefined ? [] : [role.pipe]),
    });
  } catch (error) {
    return [...checks, { status: 'error', message: error instanceof Error ? error.message : String(error) }];
  }
  if (scan.parseErrors.length > 0) {
    checks.push({ status: 'warning', message: `scan could not parse ${scan.parseErrors.length} template(s): ${scan.parseErrors.map((error) => error.file).join(', ')}.` });
  }
  if ((scan.missingDependencies?.length ?? 0) > 0) {
    checks.push({ status: 'warning', message: `scan skipped missing dependencies: ${scan.missingDependencies?.join(', ')}.` });
  }
  const lintUsage = roles.length > 0 ? await prepareRoleUsageLint(root, loaded.config) : undefined;
  for (const [name, role] of Object.entries(loaded.config.roles)) {
    checks.push(checkRoleTarget(name, role, scan));
    const usageChecks = checkUsage(name, role);
    checks.push(...usageChecks);
    if (usageChecks[0]?.status === 'ok') {
      if (lintUsage !== undefined) checks.push(lintUsage(name, role.usage));
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

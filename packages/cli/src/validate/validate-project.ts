import { loadConfig, type LoadedConfig } from '../config/load-config';
import { resolveRules } from '../config/resolve-rules';
import { RULE_NAMES, type HouserulesConfig } from '../config/schema';
import { scanProject, type ScanReport } from '../scan/scan-project';
import { checkReplacementExample, checkReplacementScan, checkRestriction } from './example-checks';
import { checkRoleTarget, checkUsage, type Check } from './role-checks';
import { lintUsageCheck, prepareTemplateLint, type PreparedLint } from './self-lint';

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

function asList(value: string | readonly string[] | undefined): readonly string[] {
  if (value === undefined) return [];
  return typeof value === 'string' ? [value] : value;
}

function scanChecks(scan: ScanReport): Check[] {
  const checks: Check[] = [];
  if (scan.parseErrors.length > 0) {
    checks.push({ status: 'warning', message: `scan could not parse ${scan.parseErrors.length} template(s): ${scan.parseErrors.map((error) => error.file).join(', ')}.` });
  }
  if ((scan.missingDependencies?.length ?? 0) > 0) {
    checks.push({ status: 'warning', message: `scan skipped missing dependencies: ${scan.missingDependencies?.join(', ')}.` });
  }
  const inline = scan.inlineTemplateCount ?? 0;
  if (inline > 0) {
    checks.push({
      status: 'ok',
      message: `${inline} of ${scan.templateCount} templates are inline and counted here. ESLint checks them with \`configs.recommended({ inlineTemplates: true })\` or with the inline template processor of angular-eslint.`,
    });
  }
  return checks;
}

function roleChecks(config: HouserulesConfig, scan: ScanReport, lint: PreparedLint | undefined): Check[] {
  return Object.entries(config.roles).flatMap(([name, role]) => {
    const usageChecks = checkUsage(name, role);
    const lintCheck = usageChecks[0]?.status === 'ok' && lint !== undefined ? [lintUsageCheck(lint, name, role.usage)] : [];
    const replaces = asList(role.replaces).flatMap((selector) => {
      const summary = scan.replacements?.find((item) => item.selector === selector);
      const example = lint === undefined ? [] : [checkReplacementExample(lint, name, selector)];
      return [...(summary === undefined ? [] : [checkReplacementScan(name, summary)]), ...example];
    });
    return [checkRoleTarget(name, role, scan), ...usageChecks, ...lintCheck, ...replaces];
  });
}

export async function validateProject(root: string): Promise<Check[]> {
  const loaded = loadOrReport(root);
  if ('status' in loaded) {
    return [loaded];
  }
  const config = loaded.config;
  const checks: Check[] = [{ status: 'ok', message: `config ${loaded.path} is valid.` }];
  const roles = Object.values(config.roles);
  let scan: ScanReport;
  try {
    scan = scanProject(root, config.currencyWords, {
      roots: config.scan?.roots,
      components: roles.flatMap((role) => (role.component === undefined ? [] : [role.component])),
      pipes: roles.flatMap((role) => (role.pipe === undefined ? [] : [role.pipe])),
      replaces: roles.flatMap((role) => asList(role.replaces).map((selector) => ({ selector, ignoredFiles: asList(role.files) }))),
      nonComponentAttributes: config.nonComponentAttributes,
    });
  } catch (error) {
    return [...checks, { status: 'error', message: error instanceof Error ? error.message : String(error) }];
  }
  const needsLint = roles.length > 0 || config.restrictions.length > 0;
  const lint = needsLint ? await prepareTemplateLint(root, config) : undefined;
  return [
    ...checks,
    ...scanChecks(scan),
    ...roleChecks(config, scan, lint),
    ...(lint === undefined ? [] : config.restrictions.flatMap((restriction, index) => checkRestriction(lint, index, restriction))),
    ...ruleChecks(loaded),
  ];
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

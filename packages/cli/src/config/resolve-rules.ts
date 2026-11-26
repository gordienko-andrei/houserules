import type { HouserulesConfig, RoleMapping, RuleName, RuleSetting, RuleSeverity } from './schema';
import { RULE_METADATA } from './rule-metadata';

export interface ResolvedRule {
  readonly name: RuleName;
  readonly severity: Exclude<RuleSeverity, 'off'>;
  readonly options?: Readonly<Record<string, unknown>>;
  readonly ignoredFiles: readonly string[];
}

function asList(value: RoleMapping['files'] | RoleMapping['replaces']): readonly string[] {
  if (value === undefined) {
    return [];
  }
  return typeof value === 'string' ? [value] : value;
}

function moneyOptions(money: RoleMapping, config: HouserulesConfig): Record<string, unknown> {
  const target = money.component === undefined ? { pipe: money.pipe } : { component: money.component };
  return {
    ...target,
    usage: money.usage,
    pipes: config.moneyPipes,
    currencyWords: config.currencyWords,
  };
}

const GLUE_ROLES = ['metric', 'comparison', 'steps'] as const;

function glueOptions(config: HouserulesConfig): Record<string, unknown> | undefined {
  const usages = Object.fromEntries(
    GLUE_ROLES.flatMap((role) => {
      const mapping = config.roles[role];
      return mapping === undefined ? [] : [[role, mapping.usage]];
    }),
  );
  const options = {
    ...(Object.keys(usages).length === 0 ? {} : { usages }),
    ...(config.glueSeparators === undefined ? {} : { separators: config.glueSeparators }),
  };
  return Object.keys(options).length === 0 ? undefined : options;
}

function replacementRule(config: HouserulesConfig): Omit<ResolvedRule, 'severity'>[] {
  const replacing = Object.entries(config.roles).filter(([, role]) => role.replaces !== undefined && role.component !== undefined);
  if (replacing.length === 0) return [];
  const replacements = replacing.flatMap(([role, mapping]) =>
    asList(mapping.replaces).map((selector) => ({ role, selector, component: mapping.component, usage: mapping.usage })),
  );
  const ignoredFiles = [...new Set(replacing.flatMap(([, mapping]) => asList(mapping.files)))];
  const nonComponentAttributes = config.nonComponentAttributes.length === 0 ? {} : { nonComponentAttributes: config.nonComponentAttributes };
  return [{ name: 'prefer-role-component', options: { replacements, ...nonComponentAttributes }, ignoredFiles }];
}

function candidateRules(config: HouserulesConfig): Omit<ResolvedRule, 'severity'>[] {
  const money = config.roles['money'];
  const roleBound: Omit<ResolvedRule, 'severity'>[] =
    money === undefined
      ? []
      : [{ name: 'use-money-component', options: moneyOptions(money, config), ignoredFiles: asList(money.files) }];
  return [
    ...roleBound,
    { name: 'no-glued-fields', options: glueOptions(config), ignoredFiles: [] },
    { name: 'require-async-states', ignoredFiles: [] },
    { name: 'no-px-font-size', ignoredFiles: [] },
    ...replacementRule(config),
    ...(config.restrictions.length === 0
      ? []
      : [{
          name: 'restricted-template-syntax' as const,
          options: { restrictions: config.restrictions.map(({ selector, message }) => ({ selector, message })) },
          ignoredFiles: [],
        }]),
  ];
}

function settingOf(setting: RuleSetting | undefined): { severity?: RuleSeverity; ignores: readonly string[] } {
  if (setting === undefined) return { ignores: [] };
  return typeof setting === 'string' ? { severity: setting, ignores: [] } : { severity: setting.severity, ignores: setting.ignores };
}

export function resolveRules(config: HouserulesConfig): ResolvedRule[] {
  return candidateRules(config).flatMap((rule) => {
    const metadata = RULE_METADATA[rule.name];
    if (metadata.role !== undefined && config.roles[metadata.role] === undefined) return [];
    const defaultSeverity = config.preset === 'recommended' ? metadata.recommended : metadata.strict;
    const setting = settingOf(config.rules[rule.name]);
    const severity = setting.severity ?? defaultSeverity;
    const ignoredFiles = [...new Set([...rule.ignoredFiles, ...setting.ignores])];
    return severity === 'off' ? [] : [{ ...rule, severity, ignoredFiles }];
  });
}

import type { HouserulesConfig, RoleMapping, RuleName, RuleSeverity } from './schema';
import { RULE_METADATA } from './rule-metadata';

export interface ResolvedRule {
  readonly name: RuleName;
  readonly severity: Exclude<RuleSeverity, 'off'>;
  readonly options?: Readonly<Record<string, unknown>>;
  readonly ignoredFiles: readonly string[];
}

function toFileList(files: RoleMapping['files']): readonly string[] {
  if (files === undefined) {
    return [];
  }
  return typeof files === 'string' ? [files] : files;
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
  return Object.keys(usages).length === 0 ? undefined : { usages };
}

function candidateRules(config: HouserulesConfig): Omit<ResolvedRule, 'severity'>[] {
  const money = config.roles['money'];
  const roleBound: Omit<ResolvedRule, 'severity'>[] =
    money === undefined
      ? []
      : [{ name: 'use-money-component', options: moneyOptions(money, config), ignoredFiles: toFileList(money.files) }];
  return [
    ...roleBound,
    { name: 'no-glued-fields', options: glueOptions(config), ignoredFiles: [] },
    { name: 'require-async-states', ignoredFiles: [] },
    { name: 'no-px-font-size', ignoredFiles: [] },
  ];
}

export function resolveRules(config: HouserulesConfig): ResolvedRule[] {
  return candidateRules(config).flatMap((rule) => {
    const metadata = RULE_METADATA[rule.name];
    if (metadata.role !== undefined && config.roles[metadata.role] === undefined) return [];
    const defaultSeverity = config.preset === 'recommended' ? metadata.recommended : metadata.strict;
    const severity = config.rules[rule.name] ?? defaultSeverity;
    return severity === 'off' ? [] : [{ ...rule, severity }];
  });
}

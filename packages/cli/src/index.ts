export {
  CONFIG_FILE_NAMES,
  ConfigError,
  findConfigFile,
  loadConfig,
  parseConfig,
  type LoadedConfig,
} from './config/load-config';
export { resolveRules, type ResolvedRule } from './config/resolve-rules';
export { RULE_METADATA } from './config/rule-metadata';
export { BUILT_IN_ROLES, findBuiltInRole, isBuiltInRole, type RoleDefinition } from './config/roles';
export {
  RULE_NAMES,
  VALUE_PLACEHOLDER,
  configSchema,
  defineConfig,
  type HouserulesConfig,
  type HouserulesConfigInput,
  type RoleMapping,
  type RuleName,
  type RuleSeverity,
} from './config/schema';
export { ruleDocsUrl } from './rule-docs';
export { formatScanReport } from './scan/format-report';
export { describeMoneyWays, findMoneyCandidates, type MoneyCandidate } from './scan/money-candidates';
export { scanProject, type ComponentFacts, type PipeFacts, type ScanReport } from './scan/scan-project';
export {
  endsWithCurrencyMarker,
  findAmountsNextToCurrencyCode,
  findExpressionsNextToCurrency,
  startsWithCurrencyMarker,
} from './text/currency-text';

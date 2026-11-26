export {
  CONFIG_FILE_NAMES,
  ConfigError,
  findConfigFile,
  loadConfig,
  parseConfig,
  type LoadedConfig,
} from './config/load-config';
export {
  describeElementSelector,
  elementFactsOf,
  isCustomElementSelector,
  matchesElementSelector,
  parseElementSelector,
  selectorCovers,
  splitSelectorList,
  type AttributeCondition,
  type ElementFacts,
  type ElementSelector,
} from './config/element-selector';
export { directiveAttributesOf, isPlainNativeMatch, isStandardAttribute } from './config/html-attributes';
export { resolveRules, type ResolvedRule } from './config/resolve-rules';
export { RULE_METADATA } from './config/rule-metadata';
export { BUILT_IN_ROLES, findBuiltInRole, isBuiltInRole, type RoleDefinition } from './config/roles';
export {
  RULE_NAMES,
  VALUE_PLACEHOLDER,
  configSchema,
  DEFAULT_GLUE_SEPARATORS,
  defineConfig,
  type HouserulesConfig,
  type HouserulesConfigInput,
  type Restriction,
  type RoleMapping,
  type RuleName,
  type RuleSetting,
  type RuleSeverity,
} from './config/schema';
export { ruleDocsUrl } from './rule-docs';
export { formatScanReport } from './scan/format-report';
export { describeMoneyWays, findMoneyCandidates, type MoneyCandidate } from './scan/money-candidates';
export { findInlineTemplates, type InlineTemplateSpan } from './scan/declarations';
export { DEFAULT_RESOURCE_FACTORIES, findResourceMembers } from './scan/resource-members';
export { scanProject, type ComponentFacts, type PipeFacts, type ScanReport } from './scan/scan-project';
export {
  endsWithCurrencyMarker,
  findAmountsNextToCurrencyCode,
  findExpressionsNextToCurrency,
  isCurrencyMarker,
  startsWithCurrencyMarker,
} from './text/currency-text';

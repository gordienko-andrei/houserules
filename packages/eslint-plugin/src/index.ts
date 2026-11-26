import type { ESLint } from 'eslint';
import { version } from '../package.json';
import { createRecommended } from './configs/recommended';
import { createInlineTemplatesProcessor, INLINE_TEMPLATES_ONLY_PROCESSOR, INLINE_TEMPLATES_PROCESSOR } from './processors/inline-templates';
import { RULE_NAME as NO_GLUED_FIELDS, noGluedFields } from './rules/no-glued-fields/rule';
import { RULE_NAME as NO_HARDCODED_PLURAL, noHardcodedPlural } from './rules/no-hardcoded-plural/rule';
import { RULE_NAME as NO_PX_FONT_SIZE, noPxFontSize } from './rules/no-px-font-size/rule';
import { RULE_NAME as PREFER_ROLE_COMPONENT, preferRoleComponent } from './rules/prefer-role-component/rule';
import { RULE_NAME as NO_TEMPLATE_ARITHMETIC, noTemplateArithmetic } from './rules/no-template-arithmetic/rule';
import { RULE_NAME as REQUIRE_ASYNC_STATES, requireAsyncStates } from './rules/require-async-states/rule';
import { RULE_NAME as REQUIRE_EMPTY_STATE, requireEmptyState } from './rules/require-empty-state/rule';
import { RULE_NAME as RESTRICTED_TEMPLATE_SYNTAX, restrictedTemplateSyntax } from './rules/restricted-template-syntax/rule';
import { RULE_NAME as USE_FORMAT_ROLE, useFormatRole } from './rules/use-format-role/rule';
import { RULE_NAME as USE_MONEY_COMPONENT, useMoneyComponent } from './rules/use-money-component/rule';

export type { RecommendedOptions } from './configs/recommended';

const rules = {
  [USE_MONEY_COMPONENT]: useMoneyComponent,
  [NO_GLUED_FIELDS]: noGluedFields,
  [REQUIRE_ASYNC_STATES]: requireAsyncStates,
  [NO_PX_FONT_SIZE]: noPxFontSize,
  [PREFER_ROLE_COMPONENT]: preferRoleComponent,
  [RESTRICTED_TEMPLATE_SYNTAX]: restrictedTemplateSyntax,
  [USE_FORMAT_ROLE]: useFormatRole,
  [REQUIRE_EMPTY_STATE]: requireEmptyState,
  [NO_TEMPLATE_ARITHMETIC]: noTemplateArithmetic,
  [NO_HARDCODED_PLURAL]: noHardcodedPlural,
};

export const plugin = {
  meta: {
    name: 'eslint-plugin-houserules',
    version,
  },
  // typescript-eslint rule types are stricter than ESLint core ones, so eslint.config.ts would reject them without this cast.
  rules: rules as unknown as NonNullable<ESLint.Plugin['rules']>,
  processors: {
    [INLINE_TEMPLATES_PROCESSOR]: createInlineTemplatesProcessor(true),
    [INLINE_TEMPLATES_ONLY_PROCESSOR]: createInlineTemplatesProcessor(false),
  } as NonNullable<ESLint.Plugin['processors']>,
} satisfies ESLint.Plugin;

// ESLint.Plugin allows only config objects in `configs`, so the factory lives on a separate default export.
const houserules = {
  ...plugin,
  configs: { recommended: createRecommended(plugin) },
};

export default houserules;

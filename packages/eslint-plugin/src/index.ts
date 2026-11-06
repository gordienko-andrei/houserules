import type { ESLint } from 'eslint';
import { createRecommended } from './configs/recommended';
import { RULE_NAME as NO_GLUED_FIELDS, noGluedFields } from './rules/no-glued-fields/rule';
import { RULE_NAME as NO_PX_FONT_SIZE, noPxFontSize } from './rules/no-px-font-size/rule';
import { RULE_NAME as REQUIRE_ASYNC_STATES, requireAsyncStates } from './rules/require-async-states/rule';
import { RULE_NAME as USE_MONEY_COMPONENT, useMoneyComponent } from './rules/use-money-component/rule';

export type { RecommendedOptions } from './configs/recommended';

const rules = {
  [USE_MONEY_COMPONENT]: useMoneyComponent,
  [NO_GLUED_FIELDS]: noGluedFields,
  [REQUIRE_ASYNC_STATES]: requireAsyncStates,
  [NO_PX_FONT_SIZE]: noPxFontSize,
};

export const plugin = {
  meta: {
    name: 'eslint-plugin-houserules',
    version: '0.0.0',
  },
  // typescript-eslint rule types are stricter than ESLint core ones, so eslint.config.ts would reject them without this cast.
  rules: rules as unknown as NonNullable<ESLint.Plugin['rules']>,
} satisfies ESLint.Plugin;

// ESLint.Plugin allows only config objects in `configs`, so the factory lives on a separate default export.
const houserules = {
  ...plugin,
  configs: { recommended: createRecommended(plugin) },
};

export default houserules;

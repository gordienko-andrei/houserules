import type { ESLint } from 'eslint';
import { RULE_NAME as USE_MONEY_COMPONENT, useMoneyComponent } from './rules/use-money-component/rule';

const rules = {
  [USE_MONEY_COMPONENT]: useMoneyComponent,
};

const plugin = {
  meta: {
    name: 'eslint-plugin-houserules',
    version: '0.0.0',
  },
  // typescript-eslint rule types are stricter than ESLint core ones, so eslint.config.ts would reject them without this cast.
  rules: rules as unknown as NonNullable<ESLint.Plugin['rules']>,
} satisfies ESLint.Plugin;

export default plugin;

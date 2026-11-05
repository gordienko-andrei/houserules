import { ESLintUtils } from '@typescript-eslint/utils';

const RULE_DOCS_BASE_URL =
  'https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules';

export const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `${RULE_DOCS_BASE_URL}/${ruleName}.md`,
);

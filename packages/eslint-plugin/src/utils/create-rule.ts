import { ESLintUtils } from '@typescript-eslint/utils';
import { ruleDocsUrl } from '@andrewgordienko/houserules';

export const createRule = ESLintUtils.RuleCreator(ruleDocsUrl);

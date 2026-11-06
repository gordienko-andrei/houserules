import { ESLintUtils } from '@typescript-eslint/utils';
import { ruleDocsUrl } from 'houserules';

export const createRule = ESLintUtils.RuleCreator(ruleDocsUrl);

const RULE_DOCS_BASE_URL = 'https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules';

export function ruleDocsUrl(ruleName: string): string {
  return `${RULE_DOCS_BASE_URL}/${ruleName}.md`;
}

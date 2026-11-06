export const VALUE_PLACEHOLDER = '$value';

const QUOTES = ['"', "'", '`'];
const WHITESPACE_RUN = /\s+/g;

export function normalizeExpression(expressionText: string): string {
  return expressionText.trim().replace(WHITESPACE_RUN, ' ');
}

function hasConflictingQuotes(usage: string, expression: string): boolean {
  return QUOTES.some((quote) => usage.includes(quote) && expression.includes(quote));
}

export function renderUsage(usage: string, expressionText: string): string | undefined {
  const expression = normalizeExpression(expressionText);
  if (expression === '' || !usage.includes(VALUE_PLACEHOLDER)) {
    return undefined;
  }
  if (hasConflictingQuotes(usage, expression)) {
    return undefined;
  }
  return usage.split(VALUE_PLACEHOLDER).join(expression);
}

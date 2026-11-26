import { nameTokens } from '../scan/usage-summary';

const CURRENCY_SYMBOL_AT_END = /\p{Sc}$/u;
const CURRENCY_SYMBOL_AT_START = /^\p{Sc}/u;
const LETTER = /\p{L}/u;
const MAGNITUDE_SUFFIX = /^\s*(?:bn|mn|[kKmMB])(?!\p{L})\.?/u;
const SYMBOL_WITH_PREFIX = /^\p{L}{0,3}\p{Sc}$/u;

function isLetter(character: string | undefined): boolean {
  return character !== undefined && LETTER.test(character);
}

export function endsWithCurrencyMarker(text: string, currencyWords: readonly string[]): boolean {
  const trimmed = text.trimEnd();
  if (CURRENCY_SYMBOL_AT_END.test(trimmed)) {
    return true;
  }
  return currencyWords.some(
    (word) => trimmed.endsWith(word) && !isLetter(trimmed[trimmed.length - word.length - 1]),
  );
}

// `{{ amount }}k £`: a magnitude suffix stands between the amount and its currency.
export function startsWithCurrencyMarker(text: string, currencyWords: readonly string[]): boolean {
  const trimmed = text.replace(MAGNITUDE_SUFFIX, '').trimStart();
  if (CURRENCY_SYMBOL_AT_START.test(trimmed)) {
    return true;
  }
  return currencyWords.some((word) => trimmed.startsWith(word) && !isLetter(trimmed[word.length]));
}

export function isCurrencyMarker(text: string, currencyWords: readonly string[]): boolean {
  const trimmed = text.trim();
  return SYMBOL_WITH_PREFIX.test(trimmed) || currencyWords.includes(trimmed);
}

export function findExpressionsNextToCurrency(
  strings: readonly string[],
  currencyWords: readonly string[],
): number[] {
  const expressionCount = Math.max(strings.length - 1, 0);
  const indexes: number[] = [];
  for (let index = 0; index < expressionCount; index++) {
    const textBefore = strings[index] ?? '';
    const textAfter = strings[index + 1] ?? '';
    if (
      endsWithCurrencyMarker(textBefore, currencyWords) ||
      startsWithCurrencyMarker(textAfter, currencyWords)
    ) {
      indexes.push(index);
    }
  }
  return indexes;
}

const PLAIN_PATH = /^[\w$.?!\s]+(?:\(\s*\))?$/;
const LAST_NAME = /([A-Za-z_$][\w$]*)\s*(?:\(\s*\))?\s*$/;
const CURRENCY_CODE_NAME = /currency(?:code)?$/i;
const NUMBER_PIPE = /\|\s*(?:number|decimal)\b/;
const AMOUNT_TOKENS = new Set(['money', 'amount', 'price', 'cost', 'balance', 'sum', 'total', 'payment', 'value']);

export function isCurrencyCodeExpression(expression: string): boolean {
  const trimmed = expression.trim();
  const lastName = LAST_NAME.exec(trimmed)?.[1];
  return PLAIN_PATH.test(trimmed) && lastName !== undefined && CURRENCY_CODE_NAME.test(lastName);
}

export function isAmountExpression(expression: string): boolean {
  if (isCurrencyCodeExpression(expression)) {
    return false;
  }
  return NUMBER_PIPE.test(expression) || nameTokens(expression).some((token) => AMOUNT_TOKENS.has(token));
}

// Common ISO 4217 codes. Codes that are also English words (`try`, `all`, `top`, `cup`) are left out.
const CURRENCY_CODE_TOKENS = new Set([
  'usd', 'eur', 'gbp', 'rub', 'jpy', 'cny', 'chf', 'cad', 'aud', 'nzd', 'inr', 'uah', 'kzt', 'byn', 'pln', 'czk', 'huf',
  'sek', 'nok', 'dkk', 'brl', 'mxn', 'krw', 'sgd', 'hkd', 'ils', 'aed', 'sar', 'zar',
]);
const IDENTIFIER = /[A-Za-z_$][\w$]*/g;
const MONEY_PIPE = /\|\s*currency\b/;

// `salaryFloorGbp`, `price_usd`: the last word of a name is a currency code. A hint for `scan`, never a lint error.
export function isCurrencyNamed(expression: string, currencyWords: readonly string[] = []): boolean {
  if (MONEY_PIPE.test(expression)) return false;
  const codes = new Set([...CURRENCY_CODE_TOKENS, ...currencyWords.map((word) => word.toLowerCase())]);
  return (expression.match(IDENTIFIER) ?? []).some((name) => {
    const tokens = nameTokens(name);
    const last = tokens.at(-1);
    return tokens.length > 1 && last !== undefined && codes.has(last);
  });
}

export function findAmountsNextToCurrencyCode(strings: readonly string[], expressions: readonly string[]): number[] {
  const indexes = new Set<number>();
  expressions.forEach((expression, index) => {
    if (!isCurrencyCodeExpression(expression)) {
      return;
    }
    for (const neighbor of [index - 1, index + 1]) {
      const gap = strings[Math.max(index, neighbor)] ?? '';
      const neighborExpression = expressions[neighbor];
      if (neighborExpression !== undefined && gap.trim() === '' && isAmountExpression(neighborExpression)) {
        indexes.add(neighbor);
      }
    }
  });
  return [...indexes].sort((left, right) => left - right);
}

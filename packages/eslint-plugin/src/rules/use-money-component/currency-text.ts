const CURRENCY_SYMBOL_AT_END = /\p{Sc}$/u;
const CURRENCY_SYMBOL_AT_START = /^\p{Sc}/u;
const LETTER = /\p{L}/u;

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

export function startsWithCurrencyMarker(text: string, currencyWords: readonly string[]): boolean {
  const trimmed = text.trimStart();
  if (CURRENCY_SYMBOL_AT_START.test(trimmed)) {
    return true;
  }
  return currencyWords.some((word) => trimmed.startsWith(word) && !isLetter(trimmed[word.length]));
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

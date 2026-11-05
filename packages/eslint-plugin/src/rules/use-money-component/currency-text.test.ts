import { describe, expect, it } from 'vitest';
import {
  endsWithCurrencyMarker,
  findExpressionsNextToCurrency,
  startsWithCurrencyMarker,
} from './currency-text';

describe('endsWithCurrencyMarker', () => {
  it('detects a currency symbol before the value', () => {
    expect(endsWithCurrencyMarker('Total: $', [])).toBe(true);
    expect(endsWithCurrencyMarker('€ ', [])).toBe(true);
  });

  it('detects a configured currency word as a whole word', () => {
    expect(endsWithCurrencyMarker('Price, USD ', ['USD'])).toBe(true);
    expect(endsWithCurrencyMarker('XUSD ', ['USD'])).toBe(false);
  });

  it('ignores plain text', () => {
    expect(endsWithCurrencyMarker('Total: ', ['USD'])).toBe(false);
    expect(endsWithCurrencyMarker('', [])).toBe(false);
  });
});

describe('startsWithCurrencyMarker', () => {
  it('detects a currency symbol after the value', () => {
    expect(startsWithCurrencyMarker(' ₽', [])).toBe(true);
    expect(startsWithCurrencyMarker('£ total', [])).toBe(true);
  });

  it('detects a configured currency word as a whole word', () => {
    expect(startsWithCurrencyMarker(' руб.', ['руб.'])).toBe(true);
    expect(startsWithCurrencyMarker(' руб', ['руб'])).toBe(true);
    expect(startsWithCurrencyMarker(' рублей', ['руб'])).toBe(false);
  });

  it('ignores plain text', () => {
    expect(startsWithCurrencyMarker(' items', ['USD'])).toBe(false);
    expect(startsWithCurrencyMarker(' %', [])).toBe(false);
  });
});

describe('findExpressionsNextToCurrency', () => {
  it('returns indexes of expressions that touch a currency marker', () => {
    expect(findExpressionsNextToCurrency(['', ' ₽ / ', ' items'], [])).toEqual([0]);
    expect(findExpressionsNextToCurrency(['$', ' and $', ''], [])).toEqual([0, 1]);
  });

  it('returns nothing for text without expressions or markers', () => {
    expect(findExpressionsNextToCurrency(['plain text'], [])).toEqual([]);
    expect(findExpressionsNextToCurrency(['Total: ', ''], [])).toEqual([]);
  });
});

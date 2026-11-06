import { describe, expect, it } from 'vitest';
import {
  endsWithCurrencyMarker,
  findAmountsNextToCurrencyCode,
  findExpressionsNextToCurrency,
  isAmountExpression,
  isCurrencyCodeExpression,
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

describe('isCurrencyCodeExpression', () => {
  it('detects a property or signal named like a currency code', () => {
    expect(isCurrencyCodeExpression('baseCurrency')).toBe(true);
    expect(isCurrencyCodeExpression('order?.currency')).toBe(true);
    expect(isCurrencyCodeExpression('currencyCode()')).toBe(true);
  });

  it('ignores other expressions', () => {
    expect(isCurrencyCodeExpression('currencies.length')).toBe(false);
    expect(isCurrencyCodeExpression('total | currency')).toBe(false);
    expect(isCurrencyCodeExpression('currency === "USD"')).toBe(false);
  });
});

describe('isAmountExpression', () => {
  it('detects money names and number pipes', () => {
    expect(isAmountExpression('order.total')).toBe(true);
    expect(isAmountExpression("price / 15 | number: '1.2-2'")).toBe(true);
    expect(isAmountExpression('rate | number')).toBe(true);
  });

  it('ignores names and currency codes', () => {
    expect(isAmountExpression('account.name')).toBe(false);
    expect(isAmountExpression('account.currency')).toBe(false);
  });
});

describe('findAmountsNextToCurrencyCode', () => {
  it('finds an amount right before or after a currency code', () => {
    expect(findAmountsNextToCurrencyCode(['', ' ', ''], ['baseCurrency', 'price / 15 | number'])).toEqual([1]);
    expect(findAmountsNextToCurrencyCode(['', ' ', ''], ['order.total', 'order.currency'])).toEqual([0]);
  });

  it('ignores values separated by text or not looking like amounts', () => {
    expect(findAmountsNextToCurrencyCode(['', ' · ', ''], ['symbol', 'currency'])).toEqual([]);
    expect(findAmountsNextToCurrencyCode(['', ' in ', ''], ['total', 'currency'])).toEqual([]);
    expect(findAmountsNextToCurrencyCode(['', ' ', ''], ['account.name', 'account.currency'])).toEqual([]);
  });
});

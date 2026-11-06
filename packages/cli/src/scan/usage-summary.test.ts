import { describe, expect, it } from 'vitest';
import type { ElementUsage } from './template-facts';
import { moneyTokensOf, nameTokens, summarizeUsages } from './usage-summary';

function usage(attributeNames: string[], line: number): ElementUsage {
  return { selector: 'ui-money', attributeNames, example: { file: 'a.html', line, text: `call ${line}` } };
}

describe('summarizeUsages', () => {
  it('groups calls by attribute set, most common first, with the first example of each', () => {
    const summary = summarizeUsages([usage(['value'], 1), usage(['currency', 'value'], 2), usage(['currency', 'value'], 3)]);
    expect(summary).toEqual({
      count: 3,
      shapes: [
        { attributes: ['currency', 'value'], count: 2, example: { file: 'a.html', line: 2, text: 'call 2' } },
        { attributes: ['value'], count: 1, example: { file: 'a.html', line: 1, text: 'call 1' } },
      ],
    });
  });
});

describe('moneyTokensOf', () => {
  it('splits kebab and camel case names', () => {
    expect(nameTokens('app-project-money')).toEqual(['app', 'project', 'money']);
    expect(nameTokens('TotalAmountPipe')).toEqual(['total', 'amount', 'pipe']);
  });

  it('finds money words as whole tokens only', () => {
    expect(moneyTokensOf('appPriceTag')).toEqual(['price']);
    expect(moneyTokensOf('summary-card')).toEqual([]);
  });
});

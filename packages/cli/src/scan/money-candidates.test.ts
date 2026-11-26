import { describe, expect, it } from 'vitest';
import { describeMoneyWays, findMoneyCandidates } from './money-candidates';
import type { ComponentFacts, ScanReport } from './scan-project';
import { moneyTokensOf } from './usage-summary';

function component(selector: string, inputs: readonly string[], count: number): ComponentFacts {
  return {
    selector,
    source: 'project',
    inputs,
    isDeprecated: false,
    usage: { count, shapes: [] },
    moneyHints: [selector, ...inputs].flatMap(moneyTokensOf),
  };
}

function report(components: readonly ComponentFacts[]): ScanReport {
  return { root: '/', templateCount: 1, parseErrors: [], components, pipes: [], handFormattedMoney: { count: 0, examples: [] } };
}

describe('money candidates', () => {
  const scan = report([
    component('gf-value', ['value', 'isCurrency', 'unit'], 188),
    component('gf-line-chart', ['currency', 'historicalDataItems'], 5),
    component('gf-accounts-table', ['accounts', 'baseCurrency', 'totalBalanceInBaseCurrency'], 2),
    component('gf-currency-selector', ['currencies'], 3),
    component('app-price', [], 1),
    component('app-money-input', ['value', 'currency'], 4),
  ]);

  it('counts only components that show a single value as ways to show money', () => {
    expect(describeMoneyWays(scan)).toEqual(['<gf-value> component: 188 uses', '<app-price> component: 1 use']);
  });

  it('lists single value components first among all candidates', () => {
    expect(findMoneyCandidates(scan).map((candidate) => [candidate.name, candidate.showsSingleValue])).toEqual([
      ['gf-value', true],
      ['app-price', true],
      ['gf-line-chart', false],
      ['app-money-input', false],
      ['gf-currency-selector', false],
      ['gf-accounts-table', false],
    ]);
  });
});

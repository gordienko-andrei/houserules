import type { ElementUsage, UsageExample } from './template-facts';

export interface CallShape {
  readonly attributes: readonly string[];
  readonly count: number;
  readonly example: UsageExample;
}

export interface UsageSummary {
  readonly count: number;
  readonly shapes: readonly CallShape[];
}

const MAX_SHAPES = 3;
const MONEY_TOKENS = new Set(['money', 'amount', 'price', 'currency', 'cost', 'balance', 'sum', 'total', 'payment']);

export function summarizeUsages(usages: readonly ElementUsage[]): UsageSummary {
  const shapes = new Map<string, { attributes: readonly string[]; count: number; example: UsageExample }>();
  for (const usage of usages) {
    const key = usage.attributeNames.join(' ');
    const shape = shapes.get(key);
    shapes.set(key, {
      attributes: usage.attributeNames,
      count: (shape?.count ?? 0) + 1,
      example: shape?.example ?? usage.example,
    });
  }
  return {
    count: usages.length,
    shapes: [...shapes.values()].sort((left, right) => right.count - left.count).slice(0, MAX_SHAPES),
  };
}

export function nameTokens(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_\-.[\]]+/)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 0);
}

export function moneyTokensOf(name: string): string[] {
  return nameTokens(name).filter((token) => MONEY_TOKENS.has(token));
}

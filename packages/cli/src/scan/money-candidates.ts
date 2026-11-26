import type { ComponentFacts, PipeFacts, ScanReport } from './scan-project';
import { nameTokens } from './usage-summary';

export interface MoneyCandidate {
  readonly kind: 'component' | 'pipe';
  readonly name: string;
  readonly count: number;
  readonly showsSingleValue: boolean;
  readonly reasons: readonly string[];
}

const ANGULAR_MONEY_PIPE = 'currency';
const VALUE_INPUTS = new Set(['value', 'amount', 'price', 'sum', 'money', 'cost']);
const VALUE_NAME_TOKENS = new Set(['money', 'amount', 'price', 'cost', 'sum', 'payment']);
const CONTAINER_NAME_TOKENS = new Set(['table', 'chart', 'list', 'dialog', 'form', 'selector', 'select', 'picker', 'editor', 'input', 'field', 'calculator', 'filter']);

function showsSingleValue(component: ComponentFacts): boolean {
  const tokens = nameTokens(component.selector);
  if (tokens.some((token) => CONTAINER_NAME_TOKENS.has(token))) {
    return false;
  }
  return component.inputs.some((input) => VALUE_INPUTS.has(input)) || tokens.some((token) => VALUE_NAME_TOKENS.has(token));
}

function componentCandidate(component: ComponentFacts): MoneyCandidate | undefined {
  if (component.moneyHints.length === 0) {
    return undefined;
  }
  const isSingleValue = showsSingleValue(component);
  const reasons = [`name or inputs mention ${[...new Set(component.moneyHints)].join(', ')}`];
  if (isSingleValue) {
    reasons.push('shows a single value');
  }
  if (component.isDeprecated) {
    reasons.push('marked @deprecated');
  }
  return { kind: 'component', name: component.selector, count: component.usage.count, showsSingleValue: isSingleValue, reasons };
}

function pipeCandidate(pipe: PipeFacts): MoneyCandidate | undefined {
  if (pipe.name === ANGULAR_MONEY_PIPE) {
    return { kind: 'pipe', name: pipe.name, count: pipe.count, showsSingleValue: true, reasons: ['Angular currency pipe'] };
  }
  if (pipe.moneyHints.length === 0) {
    return undefined;
  }
  return {
    kind: 'pipe',
    name: pipe.name,
    count: pipe.count,
    showsSingleValue: true,
    reasons: [`name mentions ${[...new Set(pipe.moneyHints)].join(', ')}`],
  };
}

export function findMoneyCandidates(report: ScanReport): MoneyCandidate[] {
  const candidates = [
    ...report.components.map(componentCandidate),
    ...report.pipes.map(pipeCandidate),
  ].filter((candidate): candidate is MoneyCandidate => candidate !== undefined);
  return candidates.sort((left, right) => Number(right.showsSingleValue) - Number(left.showsSingleValue) || right.count - left.count);
}

function counted(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function describeMoneyWays(report: ScanReport): string[] {
  const ways = findMoneyCandidates(report)
    .filter((candidate) => candidate.showsSingleValue && candidate.count > 0)
    .map((candidate) =>
      candidate.kind === 'component'
        ? `<${candidate.name}> component: ${counted(candidate.count, 'use')}`
        : `${candidate.name} pipe: ${counted(candidate.count, 'use')}`,
    );
  if (report.handFormattedMoney.count > 0) {
    ways.push(`by hand next to a currency sign or code: ${counted(report.handFormattedMoney.count, 'place')}`);
  }
  const named = report.currencyNamedValues?.count ?? 0;
  if (named > 0) {
    ways.push(`as a plain value named with a currency code (check them): ${counted(named, 'place')}`);
  }
  return ways;
}

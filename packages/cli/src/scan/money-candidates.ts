import type { ComponentFacts, PipeFacts, ScanReport } from './scan-project';

export interface MoneyCandidate {
  readonly kind: 'component' | 'pipe';
  readonly name: string;
  readonly count: number;
  readonly reasons: readonly string[];
}

const ANGULAR_MONEY_PIPE = 'currency';

function componentCandidate(component: ComponentFacts): MoneyCandidate | undefined {
  if (component.moneyHints.length === 0) {
    return undefined;
  }
  const reasons = [`name or inputs mention ${[...new Set(component.moneyHints)].join(', ')}`];
  if (component.isDeprecated) {
    reasons.push('marked @deprecated');
  }
  return { kind: 'component', name: component.selector, count: component.usage.count, reasons };
}

function pipeCandidate(pipe: PipeFacts): MoneyCandidate | undefined {
  if (pipe.name === ANGULAR_MONEY_PIPE) {
    return { kind: 'pipe', name: pipe.name, count: pipe.count, reasons: ['Angular currency pipe'] };
  }
  if (pipe.moneyHints.length === 0) {
    return undefined;
  }
  return {
    kind: 'pipe',
    name: pipe.name,
    count: pipe.count,
    reasons: [`name mentions ${[...new Set(pipe.moneyHints)].join(', ')}`],
  };
}

export function findMoneyCandidates(report: ScanReport): MoneyCandidate[] {
  const candidates = [
    ...report.components.map(componentCandidate),
    ...report.pipes.map(pipeCandidate),
  ].filter((candidate): candidate is MoneyCandidate => candidate !== undefined);
  return candidates.sort((left, right) => right.count - left.count);
}

export function describeMoneyWays(report: ScanReport): string[] {
  const ways = findMoneyCandidates(report)
    .filter((candidate) => candidate.count > 0)
    .map((candidate) =>
      candidate.kind === 'component'
        ? `<${candidate.name}> component: ${candidate.count} uses`
        : `${candidate.name} pipe: ${candidate.count} uses`,
    );
  if (report.handFormattedMoney.count > 0) {
    ways.push(`by hand next to a currency sign: ${report.handFormattedMoney.count} places`);
  }
  return ways;
}

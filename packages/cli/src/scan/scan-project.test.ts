import { afterAll, describe, expect, it } from 'vitest';
import { createFixtureProject, SAMPLE_PROJECT } from '../testing/fixture-project';
import { formatScanReport } from './format-report';
import { describeMoneyWays, findMoneyCandidates } from './money-candidates';
import { scanProject } from './scan-project';

describe('scanProject', () => {
  const project = createFixtureProject(SAMPLE_PROJECT);
  afterAll(() => project.remove());
  const report = scanProject(project.root);

  it('counts templates including inline ones', () => {
    expect(report.templateCount).toBe(2);
    expect(report.parseErrors).toEqual([]);
  });

  it('tells project, library and unknown components apart', () => {
    const sources = Object.fromEntries(
      report.components.map((component) => [component.selector, [component.source, component.usage.count]]),
    );
    expect(sources).toEqual({ 'app-money': ['project', 2], 'acme-badge': ['library', 1], 'x-unknown': ['unknown', 1] });
  });

  it('tells Angular and library pipes apart', () => {
    const sources = Object.fromEntries(report.pipes.map((pipe) => [pipe.name, pipe.source]));
    expect(sources).toEqual({ currency: 'angular', acmeAmount: 'library' });
  });

  it('describes every way money is shown', () => {
    expect(findMoneyCandidates(report).map((candidate) => `${candidate.kind} ${candidate.name}`)).toEqual([
      'component app-money',
      'pipe acmeAmount',
      'pipe currency',
    ]);
    expect(describeMoneyWays(report)).toEqual([
      '<app-money> component: 2 uses',
      'acmeAmount pipe: 1 uses',
      'currency pipe: 1 uses',
      'by hand next to a currency sign: 1 places',
    ]);
  });

  it('prints a readable report with real calls and their places', () => {
    const text = formatScanReport(report);
    expect(text).toContain('Money is shown in 4 ways:');
    expect(text).toContain('2× <app-money [value]="order.total" />  src/app/orders/orders.html:1');
    expect(text).toContain('<p>{{ order.tax }} ₽</p>  src/app/orders/orders.html:5');
  });
});

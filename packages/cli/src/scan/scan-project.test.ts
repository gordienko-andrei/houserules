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
      'acmeAmount pipe: 1 use',
      'currency pipe: 1 use',
      'by hand next to a currency sign or code: 1 place',
    ]);
  });

  it('prints a readable report with real calls and their places', () => {
    const text = formatScanReport(report);
    expect(text).toContain('Money is shown in 4 ways:');
    expect(text).toContain('2× <app-money [value]="order.total" />  src/app/orders/orders.html:1');
    expect(text).toContain('<p>{{ order.tax }} ₽</p>  src/app/orders/orders.html:5');
  });

  it('discovers workspace source roots and reports incomplete scans and ambiguous declarations', () => {
    const workspace = createFixtureProject({
      'angular.json': JSON.stringify({ projects: { custom: { sourceRoot: 'custom/source' }, app: { sourceRoot: 'src' } } }),
      'package.json': JSON.stringify({ dependencies: { '@vendor/ui': '1.0.0' } }),
      'src/app.html': '<p>app</p>',
      'custom/source/a.ts': "@Component({ selector: 'ui-widget' }) class First {}",
      'custom/source/b.ts': "@Component({ selector: 'ui-widget' }) class Second {}",
    });
    try {
      const scan = scanProject(workspace.root);
      expect(scan.roots).toEqual(['src', 'custom/source']);
      expect(scan.missingDependencies).toContain('@vendor/ui');
      expect(scan.components.find((component) => component.selector === 'ui-widget')?.declarations).toHaveLength(2);
      expect(() => scanProject(workspace.root, [], { roots: ['missing'] })).toThrow('Scan root is not a directory');
    } finally {
      workspace.remove();
    }
  });

  it('lists attribute directives that a project or library declaration selects on', () => {
    const workspace = createFixtureProject({
      'package.json': JSON.stringify({ dependencies: { '@acme/kit': '1.0.0' } }),
      'node_modules/@acme/kit/index.d.ts':
        'static ɵdir: i0.ɵɵDirectiveDeclaration<KitButton, "button[kitButton],a[kitButton]", never, {}, {}, never, never, true, never>;',
      'src/app/tooltip.ts': "@Directive({ selector: '[appTooltip]' }) class Tooltip {}",
      'src/app/page.html': '<button kitButton appearance="flat">a</button><a kitButton>b</a><button kitButton appTooltip="x">c</button>',
    });
    try {
      const directives = scanProject(workspace.root).directives ?? [];
      expect(directives.map((directive) => [directive.name, directive.source, directive.count, directive.elements])).toEqual([
        ['kitButton', 'library', 3, [{ name: 'button', count: 2 }, { name: 'a', count: 1 }]],
        ['appTooltip', 'project', 1, [{ name: 'button', count: 1 }]],
      ]);
    } finally {
      workspace.remove();
    }
  });

  it('counts repeated components and keeps accurate line numbers', () => {
    const repeated = createFixtureProject({ 'src/app.html': '<ui-money />\n'.repeat(10000) });
    try {
      const component = scanProject(repeated.root).components.find((item) => item.selector === 'ui-money');
      expect(component?.usage.count).toBe(10000);
      expect(component?.usage.shapes[0]?.example.line).toBe(1);
    } finally {
      repeated.remove();
    }
  });
});

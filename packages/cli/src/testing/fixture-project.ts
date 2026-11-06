import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export interface FixtureProject {
  readonly root: string;
  remove(): void;
}

export function createFixtureProject(files: Readonly<Record<string, string>>): FixtureProject {
  const root = mkdtempSync(join(tmpdir(), 'houserules-project-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return { root, remove: () => rmSync(root, { recursive: true, force: true }) };
}

export const SAMPLE_PROJECT: Readonly<Record<string, string>> = {
  'package.json': JSON.stringify({ dependencies: { '@acme/ui': '1.0.0' } }),
  'node_modules/@acme/ui/index.d.ts': [
    'static ɵcmp: i0.ɵɵComponentDeclaration<Badge, "acme-badge", never, {}, {}, never, never, true, never>;',
    'static ɵpipe: i0.ɵɵPipeDeclaration<AmountPipe, "acmeAmount", true>;',
  ].join('\n'),
  'src/app/ui/money.component.ts': [
    "@Component({ selector: 'app-money', template: '<span>{{ value() | currency }}</span>' })",
    'export class MoneyComponent { readonly value = input.required<number>(); }',
  ].join('\n'),
  'src/app/orders/orders.html': [
    '<app-money [value]="order.total" />',
    '<app-money [value]="order.debt" />',
    '<acme-badge>{{ order.status }}</acme-badge>',
    '<p>{{ order.fee | acmeAmount }}</p>',
    '<p>{{ order.tax }} ₽</p>',
    '<x-unknown />',
  ].join('\n'),
};

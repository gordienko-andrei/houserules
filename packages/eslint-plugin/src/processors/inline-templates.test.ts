import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Linter } from 'eslint';
import { afterEach, describe, expect, it } from 'vitest';
import { lintsTypeScript } from '../configs/recommended';
import { createInlineTemplatesProcessor } from './inline-templates';

const SOURCE = ['@Component({', '  template: `<p>{{ a }}</p>`,', '})', 'export class X {}'].join('\n');

function message(line: number, column: number): Linter.LintMessage {
  return { ruleId: 'x', message: 'x', severity: 2, line, column, endLine: line, endColumn: column + 1 };
}

describe('createInlineTemplatesProcessor', () => {
  it('passes the TypeScript source on first when the project lints TypeScript', () => {
    const processor = createInlineTemplatesProcessor(true);
    const blocks = processor.preprocess?.(SOURCE, 'x.component.ts') ?? [];
    expect(blocks).toEqual([SOURCE, { text: '<p>{{ a }}</p>', filename: '0_inline-template.component.html' }]);
    expect(processor.postprocess?.([[message(4, 1)], [message(1, 4)]], 'x.component.ts').map((item) => [item.line, item.column])).toEqual([
      [4, 1],
      [2, 17],
    ]);
  });

  it('hands on only the templates when the project has no TypeScript parser', () => {
    const processor = createInlineTemplatesProcessor(false);
    expect(processor.preprocess?.(SOURCE, 'x.component.ts')).toEqual([{ text: '<p>{{ a }}</p>', filename: '0_inline-template.component.html' }]);
    expect(processor.postprocess?.([[message(1, 4)]], 'x.component.ts').map((item) => [item.line, item.column])).toEqual([[2, 17]]);
  });
});

describe('lintsTypeScript', () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

  it('finds a TypeScript parser installed in the project', () => {
    const directory = mkdtempSync(join(tmpdir(), 'houserules-ts-'));
    directories.push(directory);
    writeFileSync(join(directory, 'package.json'), '{}');
    expect(lintsTypeScript(directory)).toBe(false);
    const parser = join(directory, 'node_modules', '@typescript-eslint', 'parser');
    mkdirSync(parser, { recursive: true });
    writeFileSync(join(parser, 'package.json'), JSON.stringify({ name: '@typescript-eslint/parser', main: 'index.js' }));
    writeFileSync(join(parser, 'index.js'), '');
    expect(lintsTypeScript(directory)).toBe(true);
  });
});

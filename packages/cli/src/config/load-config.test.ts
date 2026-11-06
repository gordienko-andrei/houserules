import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './load-config';

describe('loadConfig', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'houserules-config-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('loads a TypeScript config synchronously', () => {
    writeFileSync(
      join(directory, 'houserules.config.ts'),
      `const words: string[] = ['руб.'];\nexport default { currencyWords: words };\n`,
    );
    const { path, config } = loadConfig(directory);
    expect(path).toBe(join(directory, 'houserules.config.ts'));
    expect(config.currencyWords).toEqual(['руб.']);
  });

  it('reads the file again after it changes', () => {
    const file = join(directory, 'houserules.config.ts');
    writeFileSync(file, `export default { currencyWords: ['USD'] };\n`);
    expect(loadConfig(directory).config.currencyWords).toEqual(['USD']);
    writeFileSync(file, `export default { currencyWords: ['EUR'] };\n`);
    expect(loadConfig(directory).config.currencyWords).toEqual(['EUR']);
  });

  it('explains how to create a missing config', () => {
    expect(() => loadConfig(directory)).toThrow(/npx houserules init/);
  });

  it('reports invalid fields with their path', () => {
    writeFileSync(join(directory, 'houserules.config.ts'), `export default { roles: { money: { component: 'x' } } };\n`);
    expect(() => loadConfig(directory)).toThrow(ConfigError);
    expect(() => loadConfig(directory)).toThrow(/roles\.money\.usage/);
  });
});

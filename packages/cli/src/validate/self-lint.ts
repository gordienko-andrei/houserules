import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { HouserulesConfig } from '../config/schema';
import { fillUsage, type Check } from './role-checks';

interface LintMessage {
  readonly ruleId: string | null;
  readonly message: string;
}

interface LinterInstance {
  verify(code: string, config: unknown, fileName: string): LintMessage[];
}

interface EslintModule {
  readonly Linter: new (options: { configType: 'flat' }) => LinterInstance;
}

interface PluginModule {
  readonly default: { readonly configs: { recommended(options: { config: HouserulesConfig }): unknown } };
}

async function importFromProject<T>(root: string, specifier: string): Promise<T | undefined> {
  try {
    const path = createRequire(join(resolve(root), 'package.json')).resolve(specifier);
    return (await import(pathToFileURL(path).href)) as T;
  } catch {
    return undefined;
  }
}

export async function lintRoleUsage(root: string, roleName: string, usage: string, config: HouserulesConfig): Promise<Check> {
  const eslint = await importFromProject<EslintModule>(root, 'eslint');
  const plugin = await importFromProject<PluginModule>(root, 'eslint-plugin-houserules');
  if (eslint === undefined || plugin === undefined) {
    return { status: 'skipped', message: `${roleName}: usage not linted, eslint or eslint-plugin-houserules is not installed.` };
  }
  const configs = plugin.default.configs.recommended({ config });
  const messages = new eslint.Linter({ configType: 'flat' })
    .verify(fillUsage(usage), configs, `${roleName}.usage.html`)
    .filter((message) => message.ruleId?.startsWith('houserules/') === true);
  if (messages.length === 0) {
    return { status: 'ok', message: `${roleName}: usage passes Houserules rules.` };
  }
  return { status: 'error', message: `${roleName}: usage breaks its own rules: ${messages.map((message) => message.message).join(' ')}` };
}

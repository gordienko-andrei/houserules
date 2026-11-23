import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { HouserulesConfig } from '../config/schema';
import { fillUsage, type Check } from './role-checks';

export interface LintMessage {
  readonly ruleId: string | null;
  readonly message: string;
  readonly severity: number;
  readonly fatal?: boolean;
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

export type TemplateLint = (code: string, fileName: string) => LintMessage[];

export type PreparedLint = { readonly lint: TemplateLint } | { readonly unavailable: Check['status']; readonly reason: string };

async function importFromProject<T>(root: string, specifier: string): Promise<T | undefined> {
  let path: string;
  try {
    path = createRequire(join(resolve(root), 'package.json')).resolve(specifier);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') return undefined;
    throw error;
  }
  return (await import(pathToFileURL(path).href)) as T;
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function prepareTemplateLint(root: string, config: HouserulesConfig): Promise<PreparedLint> {
  let eslint: EslintModule | undefined;
  let plugin: PluginModule | undefined;
  try {
    eslint = await importFromProject<EslintModule>(root, 'eslint');
    plugin = await importFromProject<PluginModule>(root, 'eslint-plugin-houserules');
  } catch (error) {
    return { unavailable: 'error', reason: `unable to load lint dependencies: ${reasonOf(error)}` };
  }
  if (eslint === undefined || plugin === undefined) {
    return { unavailable: 'skipped', reason: 'eslint or eslint-plugin-houserules is not installed' };
  }
  try {
    const configs = plugin.default.configs.recommended({ config });
    const linter = new eslint.Linter({ configType: 'flat' });
    return {
      lint: (code, fileName) =>
        linter.verify(code, configs, fileName).filter((message) => message.fatal === true || message.ruleId?.startsWith('houserules/') === true),
    };
  } catch (error) {
    return { unavailable: 'error', reason: `unable to configure lint: ${reasonOf(error)}` };
  }
}

export function lintUsageCheck(prepared: PreparedLint, roleName: string, usage: string): Check {
  if ('unavailable' in prepared) {
    return { status: prepared.unavailable, message: `${roleName}: usage not linted, ${prepared.reason}.` };
  }
  let messages: LintMessage[];
  try {
    messages = prepared.lint(fillUsage(usage), `${roleName}.usage.html`);
  } catch (error) {
    return { status: 'error', message: `${roleName}: unable to lint usage: ${reasonOf(error)}` };
  }
  if (messages.length === 0) {
    return { status: 'ok', message: `${roleName}: usage passes Houserules rules.` };
  }
  return {
    status: messages.some((message) => message.fatal === true || message.severity === 2) ? 'error' : 'warning',
    message: `${roleName}: usage breaks its own rules: ${messages.map((message) => message.message).join(' ')}`,
  };
}

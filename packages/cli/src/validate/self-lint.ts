import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { HouserulesConfig } from '../config/schema';
import { fillUsage, type Check } from './role-checks';

interface LintMessage {
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

export async function prepareRoleUsageLint(root: string, config: HouserulesConfig): Promise<(roleName: string, usage: string) => Check> {
  let eslint: EslintModule | undefined;
  let plugin: PluginModule | undefined;
  try {
    eslint = await importFromProject<EslintModule>(root, 'eslint');
    plugin = await importFromProject<PluginModule>(root, 'eslint-plugin-houserules');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return (roleName) => ({ status: 'error', message: `${roleName}: unable to load lint dependencies: ${reason}` });
  }
  if (eslint === undefined || plugin === undefined) {
    return (roleName) => ({ status: 'skipped', message: `${roleName}: usage not linted, eslint or eslint-plugin-houserules is not installed.` });
  }
  let linter: LinterInstance;
  let configs: unknown;
  try {
    configs = plugin.default.configs.recommended({ config });
    linter = new eslint.Linter({ configType: 'flat' });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return (roleName) => ({ status: 'error', message: `${roleName}: unable to configure lint: ${reason}` });
  }
  return (roleName, usage) => {
    let messages: LintMessage[];
    try {
      messages = linter
        .verify(fillUsage(usage), configs, `${roleName}.usage.html`)
        .filter((message) => message.fatal === true || message.ruleId?.startsWith('houserules/') === true);
    } catch (error) {
      return { status: 'error', message: `${roleName}: unable to lint usage: ${error instanceof Error ? error.message : String(error)}` };
    }
    if (messages.length === 0) {
      return { status: 'ok', message: `${roleName}: usage passes Houserules rules.` };
    }
    return { status: messages.some((message) => message.fatal === true || message.severity === 2) ? 'error' : 'warning', message: `${roleName}: usage breaks its own rules: ${messages.map((message) => message.message).join(' ')}` };
  };
}

export async function lintRoleUsage(root: string, roleName: string, usage: string, config: HouserulesConfig): Promise<Check> {
  return (await prepareRoleUsageLint(root, config))(roleName, usage);
}

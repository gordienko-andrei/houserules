import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createJiti } from 'jiti';
import type { z } from 'zod';
import { configSchema, type HouserulesConfig } from './schema';

export const CONFIG_FILE_NAMES = [
  'houserules.config.ts',
  'houserules.config.mts',
  'houserules.config.js',
  'houserules.config.mjs',
] as const;

export interface LoadedConfig {
  readonly path: string;
  readonly config: HouserulesConfig;
}

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

export function findConfigFile(cwd: string): string | undefined {
  return CONFIG_FILE_NAMES.map((fileName) => join(resolve(cwd), fileName)).find((path) => existsSync(path));
}

function formatIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n');
}

export function parseConfig(input: unknown, source = 'config'): HouserulesConfig {
  const result = configSchema.safeParse(input);
  if (!result.success) {
    throw new ConfigError(`Invalid Houserules ${source}:\n${formatIssues(result.error.issues)}`);
  }
  return result.data;
}

function importModule(path: string): unknown {
  const jiti = createJiti(import.meta.url, { moduleCache: false, fsCache: false });
  const module: unknown = jiti(path);
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return module.default;
  }
  return module;
}

export function loadConfig(cwd: string = process.cwd()): LoadedConfig {
  const path = findConfigFile(cwd);
  if (path === undefined) {
    throw new ConfigError(`No ${CONFIG_FILE_NAMES[0]} in ${cwd}. Run \`npx houserules init\` to create one.`);
  }
  return { path, config: parseConfig(importModule(path), path) };
}

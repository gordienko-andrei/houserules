import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as templateParser from '@angular-eslint/template-parser';
import type { ESLint, Linter } from 'eslint';
import {
  findConfigFile,
  loadConfig,
  parseConfig,
  resolveRules,
  type HouserulesConfigInput,
  type ResolvedRule,
} from '@andrewgordienko/houserules';
import { INLINE_TEMPLATES_ONLY_PROCESSOR, INLINE_TEMPLATES_PROCESSOR } from '../processors/inline-templates';

export interface RecommendedOptions {
  readonly cwd?: string;
  readonly config?: HouserulesConfigInput;
  readonly files?: readonly string[];
  readonly inlineTemplates?: boolean;
  readonly inlineTemplateFiles?: readonly string[];
}

const PLUGIN_PREFIX = 'houserules';
const DEFAULT_FILES = ['**/*.html'];
const DEFAULT_INLINE_TEMPLATE_FILES = ['**/*.ts'];
const TYPESCRIPT_PARSERS = ['typescript-eslint', '@typescript-eslint/parser'];

function ruleId(rule: ResolvedRule): string {
  return `${PLUGIN_PREFIX}/${rule.name}`;
}

function ruleEntry(rule: ResolvedRule): Linter.RuleEntry {
  return rule.options === undefined ? rule.severity : [rule.severity, rule.options];
}

function ignoreBlocks(rules: readonly ResolvedRule[]): Linter.Config[] {
  return rules
    .filter((rule) => rule.ignoredFiles.length > 0)
    .map((rule) => ({
      name: `${ruleId(rule)}/own-files`,
      files: [...rule.ignoredFiles],
      rules: { [ruleId(rule)]: 'off' },
    }));
}

// A plain lookup of `node_modules` keeps the answer independent of how ESLint itself was loaded.
function isInstalled(cwd: string, name: string): boolean {
  for (let directory = resolve(cwd); ; directory = dirname(directory)) {
    if (existsSync(join(directory, 'node_modules', name, 'package.json'))) return true;
    if (dirname(directory) === directory) return false;
  }
}

// Without a TypeScript parser ESLint would read the `.ts` text with espree and fail on every type annotation.
export function lintsTypeScript(cwd: string): boolean {
  return TYPESCRIPT_PARSERS.some((name) => isInstalled(cwd, name));
}

function inlineTemplateBlock(plugin: ESLint.Plugin, options: RecommendedOptions): Linter.Config[] {
  if (options.inlineTemplates !== true) return [];
  const processor = lintsTypeScript(options.cwd ?? process.cwd()) ? INLINE_TEMPLATES_PROCESSOR : INLINE_TEMPLATES_ONLY_PROCESSOR;
  return [
    {
      name: `${PLUGIN_PREFIX}/inline-templates`,
      files: [...(options.inlineTemplateFiles ?? DEFAULT_INLINE_TEMPLATE_FILES)],
      plugins: { [PLUGIN_PREFIX]: plugin },
      processor: `${PLUGIN_PREFIX}/${processor}`,
    },
  ];
}

// Without a config the linter of the whole project would fail, so the Houserules rules are left out with a warning.
function configOf(options: RecommendedOptions): ReturnType<typeof parseConfig> | undefined {
  if (options.config !== undefined) return parseConfig(options.config);
  const cwd = options.cwd ?? process.cwd();
  if (findConfigFile(cwd) === undefined) {
    console.warn(`eslint-plugin-houserules: no houserules.config.ts in ${cwd}, Houserules rules are off. Run \`npx houserules init\` or pass \`cwd\`.`);
    return undefined;
  }
  return loadConfig(cwd).config;
}

export function createRecommended(plugin: ESLint.Plugin) {
  return function recommended(options: RecommendedOptions = {}): Linter.Config[] {
    const config = configOf(options);
    if (config === undefined) return [];
    const rules = resolveRules(config);
    return [
      ...inlineTemplateBlock(plugin, options),
      {
        name: `${PLUGIN_PREFIX}/recommended`,
        files: [...(options.files ?? DEFAULT_FILES)],
        languageOptions: { parser: templateParser },
        plugins: { [PLUGIN_PREFIX]: plugin },
        rules: Object.fromEntries(rules.map((rule) => [ruleId(rule), ruleEntry(rule)])),
      },
      ...ignoreBlocks(rules),
    ];
  };
}

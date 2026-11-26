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
import { INLINE_TEMPLATES_PROCESSOR } from '../processors/inline-templates';

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

function inlineTemplateBlock(plugin: ESLint.Plugin, options: RecommendedOptions): Linter.Config[] {
  if (options.inlineTemplates !== true) return [];
  return [
    {
      name: `${PLUGIN_PREFIX}/inline-templates`,
      files: [...(options.inlineTemplateFiles ?? DEFAULT_INLINE_TEMPLATE_FILES)],
      plugins: { [PLUGIN_PREFIX]: plugin },
      processor: `${PLUGIN_PREFIX}/${INLINE_TEMPLATES_PROCESSOR}`,
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

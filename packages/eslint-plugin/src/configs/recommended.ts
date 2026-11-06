import * as templateParser from '@angular-eslint/template-parser';
import type { ESLint, Linter } from 'eslint';
import { loadConfig, parseConfig, resolveRules, type HouserulesConfigInput, type ResolvedRule } from 'houserules';

export interface RecommendedOptions {
  readonly cwd?: string;
  readonly config?: HouserulesConfigInput;
  readonly files?: readonly string[];
}

const PLUGIN_PREFIX = 'houserules';
const DEFAULT_FILES = ['**/*.html'];

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

export function createRecommended(plugin: ESLint.Plugin) {
  return function recommended(options: RecommendedOptions = {}): Linter.Config[] {
    const config = options.config === undefined ? loadConfig(options.cwd).config : parseConfig(options.config);
    const rules = resolveRules(config);
    return [
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

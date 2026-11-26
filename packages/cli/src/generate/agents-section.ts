import { resolveRules } from '../config/resolve-rules';
import { RULE_METADATA } from '../config/rule-metadata';
import { findBuiltInRole } from '../config/roles';
import { DEFAULT_GLUE_SEPARATORS, type HouserulesConfig, type RoleMapping, type RuleName } from '../config/schema';
import { ruleDocsUrl } from '../rule-docs';
import { PLAN_SKILL_NAME, SKILLS_DIRECTORY } from './skills';

export const SECTION_START = '<!-- houserules:start -->';
export const SECTION_END = '<!-- houserules:end -->';

function escapeCell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function replacesNote(role: RoleMapping): string {
  if (role.replaces === undefined) return '';
  const selectors = typeof role.replaces === 'string' ? [role.replaces] : role.replaces;
  return ` Use it instead of native ${selectors.map((selector) => `\`${selector}\``).join(', ')}.`;
}

function roleRow(name: string, role: RoleMapping): string {
  const description = (role.description ?? findBuiltInRole(name)?.description ?? '') + replacesNote(role);
  return `| ${name} | ${escapeCell(description)} | \`${escapeCell(role.usage)}\` |`;
}

function rolesTable(config: HouserulesConfig): string[] {
  const mapped = Object.entries(config.roles);
  if (mapped.length === 0) {
    return ['No roles are mapped to components yet. Show data with plain semantic markup and do not invent components.'];
  }
  const lines = [
    '| Role | When | Show with (`$value` is the shown expression) |',
    '| --- | --- | --- |',
    ...mapped.map(([name, role]) => roleRow(name, role)),
  ];
  return lines;
}

interface ScreenRule {
  readonly text: (config: HouserulesConfig) => string;
  readonly rule?: RuleName;
}

function glueRule(config: HouserulesConfig): string {
  const separators = (config.glueSeparators ?? DEFAULT_GLUE_SEPARATORS).map((separator) => `\`${separator}\``).join(', ');
  return `- One meaning, one element. Never glue different values into one line with ${separators} or arrows, metadata lines included: it is the most visible sign of generated markup. Put each value in its own element and space them with layout (\`gap\`).`;
}

// A line tied to a rule is shown only while that rule is on, so agents are not told about checks the project does not run.
const SCREEN_RULES: readonly ScreenRule[] = [
  { text: glueRule, rule: 'no-glued-fields' },
  { text: () => '- Highlight the main value and mute the secondary ones: the number itself is prominent, its rate, unit, date or source is a separate element in the muted text style of the project.' },
  { text: () => '- The backend is the only source of truth. Do not recalculate values, rewrite messages or parse their text.' },
  { text: () => '- Tone follows the real state: green only after success is a fact, never "rows are valid" before the operation is applied.' },
  { text: () => '- A fix hint stands next to the error it belongs to, and only if the backend provides it.' },
  { text: () => '- Async data shows loading, error and empty states.', rule: 'require-async-states' },
  { text: () => '- Font sizes use `rem` or project typography classes, never fixed `px`.', rule: 'no-px-font-size' },
];

function screenRules(config: HouserulesConfig): string[] {
  const enabled = new Set(resolveRules(config).map((item) => item.name));
  return SCREEN_RULES.filter((item) => (item.rule === undefined ? config.preset !== 'recommended' : enabled.has(item.rule))).map((item) =>
    item.text(config),
  );
}

function restrictionsSection(config: HouserulesConfig): string[] {
  if (config.restrictions.length === 0) return [];
  return [
    '### Project restrictions',
    '',
    ...config.restrictions.map((restriction) => `- ${restriction.message} Write it like \`${escapeCell(restriction.good)}\`.`),
    '',
  ];
}

function checksSection(config: HouserulesConfig): string[] {
  return [
    '### Checks',
    '',
    'ESLint (`eslint-plugin-houserules`) checks templates. Run it after changing a template and fix every error as its message says; each rule page shows how to fix it:',
    '',
    ...resolveRules(config).map(
      (rule) => `- [\`houserules/${rule.name}\`](${ruleDocsUrl(rule.name)}) (${rule.severity}): ${RULE_METADATA[rule.name].summary}.`,
    ),
    '',
    'Do not silence these rules with `eslint-disable`, do not remove currency signs or move formatting to TypeScript to make the linter pass. If a rule looks wrong for a case, say so in your answer.',
  ];
}

function optionalSections(config: HouserulesConfig): string[] {
  const lines: string[] = [];
  if (config.examples.length > 0) {
    lines.push('', '### Reference components', '', 'Copy the structure of these components for similar screens:', '');
    lines.push(...config.examples.map((path) => `- \`${path}\``));
  }
  if (config.glossary !== undefined) {
    lines.push('', '### Domain glossary', '', config.glossary.trim());
  }
  return lines;
}

export function renderContext(config: HouserulesConfig, roles: HouserulesConfig['roles'] = config.roles, includeProjectDetails = true): string {
  return [
    '### Roles and components',
    '',
    ...rolesTable({ ...config, roles }),
    '',
    '### Rules for every screen',
    '',
    ...screenRules(config),
    '',
    ...restrictionsSection(config),
    ...checksSection(config),
    ...(includeProjectDetails ? optionalSections(config) : []),
  ].join('\n');
}

export function renderAgentsSection(_config: HouserulesConfig): string {
  return [
    SECTION_START,
    '## Houserules',
    '',
    'Before changing an Angular template, run `npx houserules context --list`, then request relevant roles with `npx houserules context --roles money,status` (replace these names). If no mapped role applies, run `npx houserules context --guidance`. Read the returned guidance before editing. For domain glossary and reference files, add `--project`. Inspect the data contract when unsure. Run project checks after editing and report unresolved issues.',
    '',
    `For screen planning, follow \`${SKILLS_DIRECTORY}/${PLAN_SKILL_NAME}/SKILL.md\`.`,
    SECTION_END,
  ].join('\n');
}

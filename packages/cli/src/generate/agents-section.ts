import { resolveRules } from '../config/resolve-rules';
import { BUILT_IN_ROLES, findBuiltInRole } from '../config/roles';
import type { HouserulesConfig, RoleMapping } from '../config/schema';
import { PLAN_SKILL_NAME, SKILLS_DIRECTORY } from './skills';

export const SECTION_START = '<!-- houserules:start -->';
export const SECTION_END = '<!-- houserules:end -->';

const RULE_SUMMARIES: Readonly<Record<string, string>> = {
  'use-money-component': 'money is shown only with the money component or pipe from the table above',
  'no-glued-fields': 'separate values are never glued into one text with separators, commas or arrows',
  'require-async-states': 'async data has loading, error and (for lists) empty states',
  'no-px-font-size': 'font sizes are not set in fixed `px`',
};

function escapeCell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function roleRow(name: string, role: RoleMapping): string {
  const description = role.description ?? findBuiltInRole(name)?.description ?? '';
  return `| ${name} | ${escapeCell(description)} | \`${escapeCell(role.usage)}\` |`;
}

function rolesTable(config: HouserulesConfig): string[] {
  const mapped = Object.entries(config.roles);
  if (mapped.length === 0) {
    return ['No roles are mapped to components yet. Show data with plain semantic markup and do not invent components.'];
  }
  const unmapped = BUILT_IN_ROLES.map((role) => role.name).filter((name) => config.roles[name] === undefined);
  const lines = [
    '| Role | When | Show with (`$value` is the shown expression) |',
    '| --- | --- | --- |',
    ...mapped.map(([name, role]) => roleRow(name, role)),
  ];
  if (unmapped.length > 0) {
    lines.push('', `The project has no component for: ${unmapped.join(', ')}. Use plain semantic markup for them and do not invent components.`);
  }
  return lines;
}

const SCREEN_RULES = [
  '- One meaning, one element. Never glue different values into one line with `•`, `|`, commas or arrows.',
  '- The backend is the only source of truth. Do not recalculate values, rewrite messages or parse their text.',
  '- Tone follows the real state: green only after success is a fact, never "rows are valid" before the operation is applied.',
  '- A fix hint stands next to the error it belongs to, and only if the backend provides it.',
  '- Async data shows loading, error and empty states.',
  '- Font sizes use `rem` or project typography classes, never fixed `px`.',
  '- Texts come from the project i18n, not hard-coded in templates.',
];

function checksSection(config: HouserulesConfig): string[] {
  return [
    '### Checks',
    '',
    'ESLint (`eslint-plugin-houserules`) checks templates. Run it after changing a template and fix every error:',
    '',
    ...resolveRules(config).map((rule) => `- \`houserules/${rule.name}\`: ${RULE_SUMMARIES[rule.name] ?? ''}.`),
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

export function renderAgentsSection(config: HouserulesConfig): string {
  return [
    SECTION_START,
    '## Houserules: how this project shows data',
    '',
    'Generated from `houserules.config.ts` by `npx houserules generate`. Do not edit this section by hand.',
    '',
    `Before you build or change a screen that shows backend data, follow \`${SKILLS_DIRECTORY}/${PLAN_SKILL_NAME}/SKILL.md\`: read the data types, give every shown field a role, then write the template.`,
    '',
    '### Roles and components',
    '',
    ...rolesTable(config),
    '',
    '### Rules for every screen',
    '',
    ...SCREEN_RULES,
    '',
    ...checksSection(config),
    ...optionalSections(config),
    SECTION_END,
  ].join('\n');
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseConfig } from '../config/load-config';
import { createFixtureProject } from '../testing/fixture-project';
import { renderAgentsSection, renderContext, SECTION_END, SECTION_START } from './agents-section';
import { generateFiles } from './generate-files';
import { renderLearnSkill, renderPlanSkill } from './skills';
import { resolveRules } from '../config/resolve-rules';
import { ensureAgentsImport, upsertSection } from './upsert-section';

const CONFIG = parseConfig({
  roles: {
    money: { component: 'ui-money', usage: '<ui-money [value]="$value" />' },
    rating: { component: 'ui-stars', usage: '<ui-stars [value]="$value" />', description: 'Product rating from 0 to 5' },
  },
  rules: { 'no-px-font-size': 'off' },
  examples: ['src/app/orders/orders-list.component.ts'],
  glossary: '- **Debt**: a positive value means the client owes money.',
});

describe('renderAgentsSection', () => {
  const section = renderAgentsSection(CONFIG);

  it('matches the snapshot', () => {
    expect(section).toMatchSnapshot();
  });

  it('keeps persistent instructions short and loads selected role details on demand', () => {
    const large = parseConfig({ roles: Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`role${index}`, { component: `ui-item-${index}`, usage: `<ui-item-${index} />`, description: 'Item' }])) });
    expect(renderAgentsSection(large)).toBe(section);
    expect(section).toContain('houserules context --list');
    expect(section).not.toContain('ui-stars');
    const selected = renderContext(CONFIG, { money: CONFIG.roles['money']! });
    expect(selected).toContain('<ui-money');
    expect(selected).not.toContain('<ui-stars');
  });

  it('lists only the rules that are on', () => {
    expect(renderContext(CONFIG)).toContain('`houserules/use-money-component`');
    expect(renderContext(CONFIG)).not.toContain('`houserules/no-px-font-size`');
  });

  it('keeps disabled rules out of all generated instructions and reflects warnings', () => {
    const config = parseConfig({ preset: 'recommended', rules: { 'no-px-font-size': 'off' } });
    const text = renderContext(config) + renderPlanSkill(config);
    expect(text).not.toContain('Never glue');
    expect(text).not.toContain('never join values');
    expect(text).not.toContain('Font sizes use');
    expect(text).toContain('houserules/require-async-states');
    expect(text).toContain('(warn)');
  });

  it('names the configured glue separators and leaves out guidance with no check behind it', () => {
    const text = renderContext(parseConfig({ preset: 'strict', glueSeparators: ['·', '—'] }));
    expect(text).toContain('with `·`, `—` or arrows');
    expect(text).not.toContain('commas');
    expect(text).not.toContain('i18n');
  });

  it('resolves presets and explicit overrides consistently', () => {
    const severities = (input: Parameters<typeof parseConfig>[0]) =>
      Object.fromEntries(resolveRules(parseConfig(input)).map((rule) => [rule.name, rule.severity]));
    expect(severities({})['require-async-states']).toBe('error');
    expect(severities({ preset: 'strict' })['no-glued-fields']).toBe('error');
    expect(severities({ preset: 'recommended' })['no-glued-fields']).toBeUndefined();
    expect(severities({ preset: 'recommended', rules: { 'no-glued-fields': 'warn' } })['no-glued-fields']).toBe('warn');
  });

  it('names the native elements a role component replaces', () => {
    const config = parseConfig({
      roles: { action: { component: 'p-button', usage: '<p-button [label]="$value" />', replaces: ['button:not([pButton])', 'a[role=button]'] } },
    });
    expect(renderContext(config)).toContain('Use it instead of native `button:not([pButton])`, `a[role=button]`.');
    expect(renderContext(config)).toContain('`houserules/prefer-role-component`');
  });

  it('lists project restrictions with the good example', () => {
    const config = parseConfig({
      restrictions: [{ selector: 'BindingPipe[name="date"]', message: 'Show dates with <app-date>.', bad: '{{ d | date }}', good: '<app-date [value]="d" />' }],
    });
    expect(renderContext(config)).toContain('- Show dates with <app-date>. Write it like `<app-date [value]="d" />`.');
    expect(renderContext(parseConfig({}))).not.toContain('Project restrictions');
  });

  it('tells the agent not to invent components when no role is mapped', () => {
    expect(renderContext(parseConfig({}))).toContain('No roles are mapped to components yet.');
  });
});

describe('renderPlanSkill', () => {
  it('loads selected roles on demand', () => {
    expect(renderPlanSkill(CONFIG)).toContain('houserules context --roles');
  });
});

describe('renderLearnSkill', () => {
  it('asks for evidence beyond the corrected screen and proves the config on the agent version', () => {
    const skill = renderLearnSkill();
    expect(skill).toContain('name: houserules-learn');
    expect(skill).toContain('evidence outside the corrected screen');
    expect(skill).toContain('--stdin-filename');
  });
});

describe('upsertSection', () => {
  const section = `${SECTION_START}\nnew\n${SECTION_END}`;

  it('appends the section and keeps the rest of the document', () => {
    expect(upsertSection('# Project\n\nOwn rules.\n', section)).toBe(`# Project\n\nOwn rules.\n\n${section}\n`);
    expect(upsertSection('', section)).toBe(`${section}\n`);
  });

  it('replaces only the previous section', () => {
    const document = `# Project\n\n${SECTION_START}\nold\n${SECTION_END}\n\n## Tail\n`;
    expect(upsertSection(document, section)).toBe(`# Project\n\n${section}\n\n## Tail\n`);
  });
});

describe('ensureAgentsImport', () => {
  it('adds the AGENTS.md import once', () => {
    expect(ensureAgentsImport('')).toBe('@AGENTS.md\n');
    expect(ensureAgentsImport('# Claude\n')).toBe('@AGENTS.md\n\n# Claude\n');
    expect(ensureAgentsImport('@AGENTS.md\n\n# Claude\n')).toBe('@AGENTS.md\n\n# Claude\n');
  });
});

describe('generateFiles', () => {
  it('writes the files once and then reports them as up to date', () => {
    const project = createFixtureProject({ 'AGENTS.md': '# Own rules\n' });
    const first = generateFiles(project.root, CONFIG, { check: false });
    const second = generateFiles(project.root, CONFIG, { check: true });
    const agents = readFileSync(join(project.root, 'AGENTS.md'), 'utf8');
    project.remove();
    expect(first.every((change) => change.isChanged)).toBe(true);
    expect(second.some((change) => change.isChanged)).toBe(false);
    expect(agents.startsWith('# Own rules\n\n<!-- houserules:start -->')).toBe(true);
  });

  it('reports outdated files in check mode without writing them', () => {
    const project = createFixtureProject({});
    const changes = generateFiles(project.root, CONFIG, { check: true });
    const secondCheck = generateFiles(project.root, CONFIG, { check: true });
    project.remove();
    expect(changes.map((change) => change.path)).toEqual([
      'AGENTS.md',
      'CLAUDE.md',
      '.claude/skills/houserules-plan/SKILL.md',
      '.claude/skills/houserules-setup/SKILL.md',
      '.claude/skills/houserules-learn/SKILL.md',
    ]);
    expect(secondCheck.every((change) => change.isChanged)).toBe(true);
  });
});

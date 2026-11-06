import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseConfig } from '../config/load-config';
import { createFixtureProject } from '../testing/fixture-project';
import { renderAgentsSection, SECTION_END, SECTION_START } from './agents-section';
import { generateFiles } from './generate-files';
import { renderPlanSkill } from './skills';
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

  it('lists mapped roles with their usage and the roles without a component', () => {
    expect(section).toContain('| money | An amount of money.');
    expect(section).toContain('| rating | Product rating from 0 to 5 | `<ui-stars [value]="$value" />` |');
    expect(section).toContain('The project has no component for: status, metric, issue, comparison, tip, steps, code, action.');
  });

  it('lists only the rules that are on', () => {
    expect(section).toContain('`houserules/use-money-component`');
    expect(section).not.toContain('`houserules/no-px-font-size`');
  });

  it('tells the agent not to invent components when no role is mapped', () => {
    expect(renderAgentsSection(parseConfig({}))).toContain('No roles are mapped to components yet.');
  });
});

describe('renderPlanSkill', () => {
  it('lists built-in and custom roles', () => {
    expect(renderPlanSkill(CONFIG)).toContain('money, status, metric, issue, comparison, tip, steps, code, action, rating');
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
    ]);
    expect(secondCheck.every((change) => change.isChanged)).toBe(true);
  });
});

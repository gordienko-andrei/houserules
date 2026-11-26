import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseConfig } from '../config/load-config';
import { createFixtureProject } from '../testing/fixture-project';
import { findAgentsRoot, withConfigDirectory } from './agents-root';
import { generateFiles } from './generate-files';

describe('findAgentsRoot', () => {
  it('finds AGENTS.md of the repository above the config folder', () => {
    const project = createFixtureProject({ '.git/HEAD': 'ref: refs/heads/main', 'AGENTS.md': '# Repo', 'frontend/houserules.config.ts': '' });
    try {
      expect(findAgentsRoot(join(project.root, 'frontend'))).toBe(project.root);
    } finally {
      project.remove();
    }
  });

  it('stays in the config folder without AGENTS.md above it inside the repository', () => {
    const project = createFixtureProject({ '.git/HEAD': 'ref: refs/heads/main', 'frontend/houserules.config.ts': '' });
    try {
      expect(findAgentsRoot(join(project.root, 'frontend'))).toBe(join(project.root, 'frontend'));
    } finally {
      project.remove();
    }
  });
});

describe('withConfigDirectory', () => {
  it('points every command to the config folder', () => {
    expect(withConfigDirectory('Run `npx houserules context --list`.', '/repo', '/repo/frontend')).toBe(
      'Run `npx houserules context --cwd frontend --list`.',
    );
    expect(withConfigDirectory('`npx houserules scan`', '/repo', '/repo')).toBe('`npx houserules scan`');
  });
});

describe('generateFiles in a monorepo', () => {
  it('writes AGENTS.md and the skills to the agents root with commands that find the config', () => {
    const project = createFixtureProject({ 'AGENTS.md': '# Repo\n' });
    try {
      const configRoot = join(project.root, 'frontend');
      const changes = generateFiles(configRoot, parseConfig({}), { check: false, agentsRoot: project.root });
      expect(changes.map((change) => change.path)).toContain('../AGENTS.md');
      expect(existsSync(join(configRoot, 'AGENTS.md'))).toBe(false);
      const agents = readFileSync(join(project.root, 'AGENTS.md'), 'utf8');
      expect(agents).toContain('# Repo');
      expect(agents).toContain('npx houserules context --cwd frontend --list');
    } finally {
      project.remove();
    }
  });
});

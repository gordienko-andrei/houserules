import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { HouserulesConfig } from '../config/schema';
import { renderAgentsSection } from './agents-section';
import { renderSkills, type GeneratedFile } from './skills';
import { ensureAgentsImport, upsertSection } from './upsert-section';

export interface FileChange {
  readonly path: string;
  readonly isChanged: boolean;
}

function readOrEmpty(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export function planGeneratedFiles(root: string, config: HouserulesConfig): GeneratedFile[] {
  const agents = upsertSection(readOrEmpty(join(root, 'AGENTS.md')), renderAgentsSection(config));
  const claude = ensureAgentsImport(readOrEmpty(join(root, 'CLAUDE.md')));
  return [
    { path: 'AGENTS.md', content: agents },
    { path: 'CLAUDE.md', content: claude },
    ...renderSkills(config),
  ];
}

export function generateFiles(root: string, config: HouserulesConfig, options: { readonly check: boolean }): FileChange[] {
  return planGeneratedFiles(root, config).map((file) => {
    const absolutePath = join(root, file.path);
    const isChanged = readOrEmpty(absolutePath) !== file.content;
    if (isChanged && !options.check) {
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, file.content);
    }
    return { path: file.path, isChanged };
  });
}

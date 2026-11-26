import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { HouserulesConfig } from '../config/schema';
import { withConfigDirectory } from './agents-root';
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

export interface GenerateOptions {
  readonly check: boolean;
  readonly agentsRoot?: string;
}

export function planGeneratedFiles(root: string, config: HouserulesConfig, agentsRoot: string = root): GeneratedFile[] {
  const pointToConfig = (text: string): string => withConfigDirectory(text, resolve(agentsRoot), resolve(root));
  const agents = upsertSection(readOrEmpty(join(agentsRoot, 'AGENTS.md')), pointToConfig(renderAgentsSection(config)));
  const claude = ensureAgentsImport(readOrEmpty(join(agentsRoot, 'CLAUDE.md')));
  return [
    { path: 'AGENTS.md', content: agents },
    { path: 'CLAUDE.md', content: claude },
    ...renderSkills(config).map((file) => ({ ...file, content: pointToConfig(file.content) })),
  ];
}

export function generateFiles(root: string, config: HouserulesConfig, options: GenerateOptions): FileChange[] {
  const agentsRoot = options.agentsRoot ?? root;
  return planGeneratedFiles(root, config, agentsRoot).map((file) => {
    const absolutePath = join(agentsRoot, file.path);
    const isChanged = readOrEmpty(absolutePath) !== file.content;
    if (isChanged && !options.check) {
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, file.content);
    }
    return { path: relative(resolve(root), absolutePath).replaceAll('\\', '/'), isChanged };
  });
}

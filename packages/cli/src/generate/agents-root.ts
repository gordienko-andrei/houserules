import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const AGENTS_FILE = 'AGENTS.md';
const COMMAND = /npx houserules (\w+)/g;

function gitRootOf(start: string): string | undefined {
  for (let directory = start; ; directory = dirname(directory)) {
    if (existsSync(join(directory, '.git'))) return directory;
    if (dirname(directory) === directory) return undefined;
  }
}

// In a monorepo the config may live in `frontend/` while AGENTS.md and `.claude/skills` belong to the repository root.
export function findAgentsRoot(configRoot: string): string {
  const start = resolve(configRoot);
  const gitRoot = gitRootOf(start);
  if (gitRoot === undefined) return start;
  for (let directory = start; ; directory = dirname(directory)) {
    if (existsSync(join(directory, AGENTS_FILE))) return directory;
    if (directory === gitRoot || dirname(directory) === directory) return start;
  }
}

// Commands in the generated files run from the agents root, so they must point back to the config.
export function withConfigDirectory(text: string, agentsRoot: string, configRoot: string): string {
  const path = relative(agentsRoot, configRoot).replaceAll('\\', '/');
  return path === '' ? text : text.replace(COMMAND, (_match, command: string) => `npx houserules ${command} --cwd ${path}`);
}

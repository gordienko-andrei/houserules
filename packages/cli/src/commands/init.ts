import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG_FILE_NAMES, findConfigFile, loadConfig } from '../config/load-config';
import { findAgentsRoot } from '../generate/agents-root';
import { generateFiles, type FileChange } from '../generate/generate-files';
import { SETUP_SKILL_NAME, SKILLS_DIRECTORY } from '../generate/skills';

export const CONFIG_TEMPLATE = `import { defineConfig } from '@andrewgordienko/houserules';

export default defineConfig({
  preset: 'recommended',
  roles: {},
});
`;

export interface InitResult {
  readonly configPath: string;
  readonly isConfigCreated: boolean;
  readonly changes: readonly FileChange[];
}

export function initProject(root: string, agentsRoot: string = findAgentsRoot(root)): InitResult {
  const existing = findConfigFile(root);
  const configPath = existing ?? join(root, CONFIG_FILE_NAMES[0]);
  if (existing === undefined) {
    writeFileSync(configPath, CONFIG_TEMPLATE);
  }
  const changes = generateFiles(root, loadConfig(root).config, { check: false, agentsRoot });
  return { configPath, isConfigCreated: existing === undefined, changes };
}

export function formatInitResult(result: InitResult): string {
  const config = result.isConfigCreated ? `Created ${result.configPath}` : `Kept ${result.configPath}`;
  return [
    config,
    ...result.changes.map((change) => `${change.isChanged ? 'Wrote' : 'Unchanged'} ${change.path}`),
    '',
    'Next steps:',
    `  1. Ask your AI agent to set up Houserules (skill ${SKILLS_DIRECTORY}/${SETUP_SKILL_NAME}).`,
    '  2. Turn on the linter in eslint.config.mjs (.mjs keeps Node from warning in a package without "type": "module"):',
    "       import houserules from 'eslint-plugin-houserules';",
    '       export default [...yourConfigs, ...houserules.configs.recommended({ cwd: import.meta.dirname })];',
    '     Add `inlineTemplates: true` to check `template:` of components, unless angular-eslint already extracts them.',
  ].join('\n');
}

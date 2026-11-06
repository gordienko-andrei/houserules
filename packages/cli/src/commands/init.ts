import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG_FILE_NAMES, findConfigFile, loadConfig } from '../config/load-config';
import { generateFiles, type FileChange } from '../generate/generate-files';
import { SETUP_SKILL_NAME, SKILLS_DIRECTORY } from '../generate/skills';

export const CONFIG_TEMPLATE = `import { defineConfig } from 'houserules';

export default defineConfig({
  roles: {},
});
`;

export interface InitResult {
  readonly configPath: string;
  readonly isConfigCreated: boolean;
  readonly changes: readonly FileChange[];
}

export function initProject(root: string): InitResult {
  const existing = findConfigFile(root);
  const configPath = existing ?? join(root, CONFIG_FILE_NAMES[0]);
  if (existing === undefined) {
    writeFileSync(configPath, CONFIG_TEMPLATE);
  }
  const changes = generateFiles(root, loadConfig(root).config, { check: false });
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
    '  2. Turn on the linter in eslint.config.js:',
    "       import houserules from 'eslint-plugin-houserules';",
    '       export default [...yourConfigs, ...houserules.configs.recommended()];',
  ].join('\n');
}

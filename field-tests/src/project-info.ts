import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ProjectInfo {
  readonly versions: Readonly<Record<string, string>>;
  readonly eslintConfig?: string;
  readonly isNx: boolean;
}

const TRACKED_PACKAGES = ['@angular/core', 'eslint', '@angular-eslint/template-parser', 'typescript'];

function dependenciesOf(packageJson: unknown): Record<string, string> {
  if (typeof packageJson !== 'object' || packageJson === null) {
    return {};
  }
  const fields: Partial<Record<string, unknown>> = packageJson;
  const merged: Record<string, string> = {};
  for (const field of ['dependencies', 'devDependencies']) {
    const dependencies = fields[field];
    if (typeof dependencies === 'object' && dependencies !== null) {
      for (const [name, version] of Object.entries(dependencies)) {
        if (typeof version === 'string') {
          merged[name] = version;
        }
      }
    }
  }
  return merged;
}

export function readProjectInfo(root: string): ProjectInfo {
  const packageFile = join(root, 'package.json');
  const dependencies = existsSync(packageFile) ? dependenciesOf(JSON.parse(readFileSync(packageFile, 'utf8'))) : {};
  const versions = Object.fromEntries(
    TRACKED_PACKAGES.flatMap((name) => (dependencies[name] === undefined ? [] : [[name, dependencies[name]]])),
  );
  const eslintConfig = readdirSync(root).find((file) => /^eslint\.config\.[cm]?[jt]s$|^\.eslintrc/.test(file));
  return { versions, eslintConfig, isNx: existsSync(join(root, 'nx.json')) };
}

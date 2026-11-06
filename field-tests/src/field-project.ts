import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface FieldProject {
  readonly name: string;
  readonly repository: string;
  readonly ref: string;
  readonly directory: string;
  readonly checkout: string;
  readonly root: string;
}

interface ProjectSource {
  readonly repository: string;
  readonly ref: string;
  readonly root?: string;
}

export const FIELD_TESTS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS_DIRECTORY = join(FIELD_TESTS_ROOT, 'projects');
const CHECKOUTS_DIRECTORY = join(FIELD_TESTS_ROOT, '.checkouts');

function isProjectSource(value: unknown): value is ProjectSource {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const source: Partial<Record<string, unknown>> = value;
  const isRootValid = source['root'] === undefined || typeof source['root'] === 'string';
  return typeof source['repository'] === 'string' && typeof source['ref'] === 'string' && isRootValid;
}

export function loadFieldProject(name: string): FieldProject {
  const directory = join(PROJECTS_DIRECTORY, name);
  const sourceFile = join(directory, 'project.json');
  if (!existsSync(sourceFile)) {
    throw new Error(`No ${sourceFile}. Create it with { "repository": "<git url>", "ref": "<commit or branch>" }.`);
  }
  const source: unknown = JSON.parse(readFileSync(sourceFile, 'utf8'));
  if (!isProjectSource(source)) {
    throw new Error(`${sourceFile} needs string fields "repository" and "ref", and optionally "root".`);
  }
  const checkout = join(CHECKOUTS_DIRECTORY, name);
  return { name, repository: source.repository, ref: source.ref, directory, checkout, root: join(checkout, source.root ?? '') };
}

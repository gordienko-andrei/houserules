import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const IGNORED_DIRECTORIES = ['node_modules', 'dist', '.angular', '.git', '.nx', 'coverage', 'tmp'];

export function listTemplateFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return IGNORED_DIRECTORIES.includes(entry.name) ? [] : listTemplateFiles(path);
    }
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

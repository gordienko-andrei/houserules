import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', '.angular', '.git', 'coverage', '.nx', 'tmp']);

export function listFiles(directory: string, isWanted: (path: string) => boolean): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name)) {
      files.push(...listFiles(path, isWanted));
    } else if (entry.isFile() && isWanted(path)) {
      files.push(path);
    }
  }
  return files;
}

export function isTemplateFile(path: string): boolean {
  return path.endsWith('.html');
}

export function isSourceFile(path: string): boolean {
  return path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.endsWith('.d.ts');
}

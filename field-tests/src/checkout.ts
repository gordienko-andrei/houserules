import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import type { FieldProject } from './field-project';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function ensureCheckout(project: FieldProject): string {
  if (!existsSync(project.checkout)) {
    mkdirSync(project.checkout, { recursive: true });
    git(project.checkout, 'init', '--quiet');
    git(project.checkout, 'remote', 'add', 'origin', project.repository);
  }
  const head = tryHead(project.checkout);
  if (head === undefined || !head.startsWith(project.ref)) {
    git(project.checkout, 'fetch', '--quiet', '--depth', '1', 'origin', project.ref);
    git(project.checkout, 'checkout', '--quiet', '--force', 'FETCH_HEAD');
  }
  return git(project.checkout, 'rev-parse', 'HEAD');
}

function tryHead(checkout: string): string | undefined {
  try {
    return git(checkout, 'rev-parse', 'HEAD');
  } catch {
    return undefined;
  }
}

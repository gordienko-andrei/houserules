import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { performance } from 'node:perf_hooks';
import { ESLint } from 'eslint';
import houserules from 'eslint-plugin-houserules';
import type { HouserulesConfigInput } from '@andrewgordienko/houserules';
import { IGNORED_DIRECTORIES, listTemplateFiles } from './template-files';

export interface Finding {
  readonly ruleId: string;
  readonly messageId?: string;
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly code: string;
}

export interface FileProblem {
  readonly file: string;
  readonly message: string;
}

export interface LintRun {
  readonly fileCount: number;
  readonly durationMs: number;
  readonly findings: readonly Finding[];
  readonly parseErrors: readonly FileProblem[];
  readonly crashes: readonly FileProblem[];
}

function createLinter(root: string, config: HouserulesConfigInput): ESLint {
  return new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      { ignores: IGNORED_DIRECTORIES.map((directory) => `**/${directory}/**`) },
      ...houserules.configs.recommended({ config }),
    ],
  });
}

function shownPath(root: string, file: string): string {
  return relative(root, file).replaceAll('\\', '/');
}

function collectResults(root: string, results: readonly ESLint.LintResult[]): Pick<LintRun, 'findings' | 'parseErrors'> {
  const findings: Finding[] = [];
  const parseErrors: FileProblem[] = [];
  for (const result of results) {
    const file = shownPath(root, result.filePath);
    const lines = result.source?.split(/\r?\n/) ?? readFileSync(result.filePath, 'utf8').split(/\r?\n/);
    for (const message of result.messages) {
      if (message.fatal === true || message.ruleId === null) {
        parseErrors.push({ file, message: message.message });
        continue;
      }
      findings.push({
        ruleId: message.ruleId,
        messageId: message.messageId,
        file,
        line: message.line,
        column: message.column,
        message: message.message,
        code: (lines[message.line - 1] ?? '').trim(),
      });
    }
  }
  return { findings, parseErrors };
}

async function lintEachFile(linter: ESLint, root: string, files: readonly string[]): Promise<{ results: ESLint.LintResult[]; crashes: FileProblem[] }> {
  const results: ESLint.LintResult[] = [];
  const crashes: FileProblem[] = [];
  for (const file of files) {
    try {
      results.push(...(await linter.lintFiles([file])));
    } catch (error) {
      crashes.push({ file: shownPath(root, file), message: error instanceof Error ? error.message : String(error) });
    }
  }
  return { results, crashes };
}

export async function lintProject(root: string, config: HouserulesConfigInput): Promise<LintRun> {
  const files = listTemplateFiles(root);
  const linter = createLinter(root, config);
  const startedAt = performance.now();
  let results: ESLint.LintResult[];
  let crashes: FileProblem[] = [];
  try {
    results = await linter.lintFiles(files);
  } catch {
    ({ results, crashes } = await lintEachFile(linter, root, files));
  }
  const durationMs = performance.now() - startedAt;
  return { fileCount: files.length, durationMs, crashes, ...collectResults(root, results) };
}

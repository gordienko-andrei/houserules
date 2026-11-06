import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { performance } from 'node:perf_hooks';
import houserulesStylelint from 'houserules/stylelint';
import postcssScss from 'postcss-scss';
import stylelint from 'stylelint';
import type { FileProblem, Finding } from './lint-project';
import { IGNORED_DIRECTORIES } from './template-files';

export interface StyleRun {
  readonly fileCount: number;
  readonly durationMs: number;
  readonly findings: readonly Finding[];
  readonly parseErrors: readonly FileProblem[];
}

function findingsOf(root: string, result: stylelint.LintResult): Finding[] {
  const source = result.source;
  if (source === undefined) {
    return [];
  }
  const lines = readFileSync(source, 'utf8').split(/\r?\n/);
  const file = relative(root, source).replaceAll('\\', '/');
  return result.warnings.map((warning) => ({
    ruleId: `stylelint/${warning.rule}`,
    file,
    line: warning.line,
    column: warning.column,
    message: warning.text,
    code: (lines[warning.line - 1] ?? '').trim(),
  }));
}

export async function lintStyles(root: string): Promise<StyleRun> {
  const startedAt = performance.now();
  const { results } = await stylelint.lint({
    cwd: root,
    files: '**/*.{css,scss}',
    config: houserulesStylelint,
    customSyntax: postcssScss,
    ignorePattern: IGNORED_DIRECTORIES.map((directory) => `**/${directory}/**`),
    allowEmptyInput: true,
  });
  return {
    fileCount: results.length,
    durationMs: performance.now() - startedAt,
    findings: results.flatMap((result) => findingsOf(root, result)),
    parseErrors: results.flatMap((result) =>
      result.parseErrors.map((error) => ({ file: relative(root, result.source ?? '').replaceAll('\\', '/'), message: error.text })),
    ),
  };
}

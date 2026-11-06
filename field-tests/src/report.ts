import type { ProjectInfo } from './project-info';
import type { Finding, FileProblem, LintRun } from './lint-project';
import type { StyleRun } from './lint-styles';

export interface FieldTestResult {
  readonly name: string;
  readonly repository: string;
  readonly commit: string;
  readonly date: string;
  readonly info: ProjectInfo;
  readonly roles: readonly string[];
  readonly lint: LintRun;
  readonly styles: StyleRun;
  readonly scanTemplateCount: number;
  readonly scanText: string;
}

export interface MessageCount {
  readonly ruleId: string;
  readonly messageId: string;
  readonly count: number;
  readonly example: string;
}

export const MAX_FINDINGS_PER_RULE = 50;
const MAX_CODE_LENGTH = 120;

export function countMessages(findings: readonly Finding[]): MessageCount[] {
  const counts = new Map<string, MessageCount>();
  for (const finding of findings) {
    const messageId = finding.messageId ?? '';
    const key = `${finding.ruleId}\u0000${messageId}`;
    const current = counts.get(key);
    counts.set(key, { ruleId: finding.ruleId, messageId, count: (current?.count ?? 0) + 1, example: current?.example ?? finding.message });
  }
  return [...counts.values()].sort((left, right) => left.ruleId.localeCompare(right.ruleId) || right.count - left.count);
}

export function codeCell(code: string): string {
  const shortened = code.length > MAX_CODE_LENGTH ? `${code.slice(0, MAX_CODE_LENGTH)}…` : code;
  const escaped = shortened.replaceAll('|', '\\|');
  if (escaped === '') {
    return '';
  }
  return escaped.includes('`') ? `\`\` ${escaped} \`\`` : `\`${escaped}\``;
}

function textCell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll(/\r?\n/g, ' ');
}

function problemLines(title: string, problems: readonly FileProblem[]): string[] {
  if (problems.length === 0) {
    return [];
  }
  return [`### ${title} (${problems.length})`, '', ...problems.map((problem) => `- \`${problem.file}\`: ${textCell(problem.message.split('\n')[0] ?? '')}`), ''];
}

function findingsSection(ruleId: string, findings: readonly Finding[]): string[] {
  const shown = findings.slice(0, MAX_FINDINGS_PER_RULE);
  const note = findings.length > shown.length ? ['', `First ${shown.length} of ${findings.length}.`] : [];
  return [
    `### ${ruleId} (${findings.length})`,
    '',
    '| # | Where | Message | Code | Verdict |',
    '| --- | --- | --- | --- | --- |',
    ...shown.map((finding, index) => `| ${index + 1} | \`${finding.file}:${finding.line}\` | ${finding.messageId ?? ''} | ${codeCell(finding.code)} |  |`),
    ...note,
    '',
  ];
}

function headerLines(result: FieldTestResult): string[] {
  const versions = Object.entries(result.info.versions).map(([name, version]) => `${name} ${version}`).join(', ');
  return [
    `# Field test: ${result.name}`,
    '',
    '| | |',
    '| --- | --- |',
    `| Repository | ${result.repository} |`,
    `| Commit | \`${result.commit}\` |`,
    `| Run | ${result.date} |`,
    `| Versions | ${versions || 'unknown'} |`,
    `| ESLint config | ${result.info.eslintConfig ?? 'none'}${result.info.isNx ? ', Nx workspace' : ''} |`,
    `| Mapped roles | ${result.roles.length === 0 ? 'none' : result.roles.join(', ')} |`,
    '',
  ];
}

function seconds(durationMs: number): string {
  return (durationMs / 1000).toFixed(1);
}

export function allFindings(result: Pick<FieldTestResult, 'lint' | 'styles'>): Finding[] {
  return [...result.lint.findings, ...result.styles.findings];
}

function lintLines(result: FieldTestResult): string[] {
  const { lint, styles } = result;
  const findings = allFindings(result);
  return [
    '## Lint',
    '',
    `- \`.html\` templates linted with ESLint: ${lint.fileCount} in ${seconds(lint.durationMs)} s`,
    `- Templates seen by \`scan\` (\`.html\` and inline): ${result.scanTemplateCount}`,
    `- Stylesheets linted with stylelint: ${styles.fileCount} in ${seconds(styles.durationMs)} s`,
    `- Findings: ${findings.length}, parse errors: ${lint.parseErrors.length + styles.parseErrors.length}, crashes: ${lint.crashes.length}`,
    '',
    '| Rule | Message | Count | Example |',
    '| --- | --- | --- | --- |',
    ...countMessages(findings).map((count) => `| ${count.ruleId} | ${count.messageId} | ${count.count} | ${textCell(count.example)} |`),
    '',
    ...problemLines('Crashes', lint.crashes),
    ...problemLines('Parse errors', [...lint.parseErrors, ...styles.parseErrors]),
  ];
}

export function formatReport(result: FieldTestResult): string {
  const findings = allFindings(result);
  const ruleIds = [...new Set(findings.map((finding) => finding.ruleId))].sort();
  return [
    ...headerLines(result),
    ...lintLines(result),
    '## Findings',
    '',
    'Mark each finding in the Verdict column: `ok` (a real problem), `false` (a false positive) or `?`.',
    '',
    ...ruleIds.flatMap((ruleId) => findingsSection(ruleId, findings.filter((finding) => finding.ruleId === ruleId))),
    '## Scan',
    '',
    '```text',
    result.scanText,
    '```',
    '',
  ].join('\n');
}

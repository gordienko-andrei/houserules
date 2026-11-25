import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findConfigFile, formatScanReport, loadConfig, scanProject, type HouserulesConfigInput } from '@andrewgordienko/houserules';
import { ensureCheckout } from './checkout';
import { FIELD_TESTS_ROOT, loadFieldProject } from './field-project';
import { lintProject } from './lint-project';
import { lintStyles } from './lint-styles';
import { readProjectInfo } from './project-info';
import { allFindings, countMessages, formatReport } from './report';

function configOf(directory: string): HouserulesConfigInput {
  return findConfigFile(directory) === undefined ? {} : loadConfig(directory).config;
}

function availableProjects(): string[] {
  const projects = join(FIELD_TESTS_ROOT, 'projects');
  return existsSync(projects) ? readdirSync(projects) : [];
}

async function run(name: string): Promise<void> {
  const project = loadFieldProject(name);
  console.info(`Checking out ${project.repository} at ${project.ref}…`);
  const commit = ensureCheckout(project);
  const config = configOf(project.directory);
  console.info('Scanning…');
  const scan = scanProject(project.root, config.currencyWords ?? []);
  console.info('Linting…');
  const lint = await lintProject(project.root, config);
  const styles = await lintStyles(project.root);
  const report = formatReport({
    name,
    repository: project.repository,
    commit,
    date: new Date().toISOString().slice(0, 10),
    info: readProjectInfo(project.root),
    roles: Object.entries(config.roles ?? {}).map(([role, mapping]) => `${role} → ${mapping.component === undefined ? `${mapping.pipe ?? ''} pipe` : `<${mapping.component}>`}`),
    lint,
    styles,
    scanTemplateCount: scan.templateCount,
    scanText: formatScanReport(scan),
  });
  const reportFile = join(project.directory, 'report.md');
  writeFileSync(reportFile, report);
  console.info(countMessages(allFindings({ lint, styles })).map((count) => `  ${count.count}\t${count.ruleId} ${count.messageId}`).join('\n'));
  console.info(`${lint.fileCount} templates in ${(lint.durationMs / 1000).toFixed(1)} s, ${lint.parseErrors.length} parse errors, ${lint.crashes.length} crashes.`);
  console.info(`${styles.fileCount} stylesheets in ${(styles.durationMs / 1000).toFixed(1)} s, ${styles.parseErrors.length} parse errors.`);
  console.info(`Report: ${reportFile}`);
}

const name = process.argv[2];
if (name === undefined) {
  console.error(`Usage: pnpm field-test <project>. Projects: ${availableProjects().join(', ') || 'none'}.`);
  process.exitCode = 1;
} else {
  await run(name);
}

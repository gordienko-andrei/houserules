#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import { loadConfig } from './config/load-config';
import { formatInitResult, initProject } from './commands/init';
import { generateFiles } from './generate/generate-files';
import { formatScanReport } from './scan/format-report';
import { findMoneyCandidates } from './scan/money-candidates';
import { scanProject } from './scan/scan-project';
import { formatChecks, hasErrors, validateProject } from './validate/validate-project';

const cwdArgument = {
  cwd: { type: 'string', description: 'Project root', default: process.cwd() },
} as const;

function currencyWordsOf(root: string): readonly string[] {
  try {
    return loadConfig(root).config.currencyWords;
  } catch {
    return [];
  }
}

const init = defineCommand({
  meta: { name: 'init', description: 'Create houserules.config.ts, the AGENTS.md section and the skills' },
  args: cwdArgument,
  run({ args }) {
    console.info(formatInitResult(initProject(args.cwd)));
  },
});

const generate = defineCommand({
  meta: { name: 'generate', description: 'Update the AGENTS.md section and the skills from the config' },
  args: { ...cwdArgument, check: { type: 'boolean', description: 'Fail if generated files are out of date' } },
  run({ args }) {
    const changes = generateFiles(args.cwd, loadConfig(args.cwd).config, { check: args.check === true });
    const changed = changes.filter((change) => change.isChanged);
    if (args.check === true && changed.length > 0) {
      console.error(`Out of date: ${changed.map((change) => change.path).join(', ')}. Run \`npx houserules generate\`.`);
      process.exitCode = 1;
      return;
    }
    console.info(changes.map((change) => `${change.isChanged ? 'Wrote' : 'Unchanged'} ${change.path}`).join('\n'));
  },
});

const scan = defineCommand({
  meta: { name: 'scan', description: 'Collect facts about components, pipes and money in templates' },
  args: { ...cwdArgument, json: { type: 'boolean', description: 'Print JSON for an AI agent' } },
  run({ args }) {
    const report = scanProject(args.cwd, currencyWordsOf(args.cwd));
    const output = args.json === true ? JSON.stringify({ ...report, moneyCandidates: findMoneyCandidates(report) }, null, 2) : formatScanReport(report);
    console.info(output);
  },
});

const validate = defineCommand({
  meta: { name: 'validate', description: 'Check that the config maps roles to real components and working calls' },
  args: cwdArgument,
  async run({ args }) {
    const checks = await validateProject(args.cwd);
    console.info(formatChecks(checks));
    if (hasErrors(checks)) {
      process.exitCode = 1;
    }
  },
});

const main = defineCommand({
  meta: { name: 'houserules', description: 'Your design system, enforced for AI agents' },
  subCommands: { init, generate, scan, validate },
});

void runMain(main);

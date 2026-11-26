#!/usr/bin/env node
import { resolve } from 'node:path';
import { defineCommand, runMain } from 'citty';
import { version } from '../package.json';
import { findConfigFile, loadConfig } from './config/load-config';
import { formatInitResult, initProject } from './commands/init';
import { findAgentsRoot } from './generate/agents-root';
import { generateFiles } from './generate/generate-files';
import { renderContext } from './generate/agents-section';
import { findBuiltInRole } from './config/roles';
import { formatScanReport } from './scan/format-report';
import { findMoneyCandidates } from './scan/money-candidates';
import { scanProject } from './scan/scan-project';
import { formatChecks, hasErrors, validateProject } from './validate/validate-project';

const cwdArgument = {
  cwd: { type: 'string', description: 'Project root', default: process.cwd() },
} as const;

const agentsDirArgument = {
  'agents-dir': {
    type: 'string',
    description: 'Where AGENTS.md, CLAUDE.md and .claude/skills live. Default: the nearest folder with AGENTS.md up to the git root, else the project root',
  },
} as const;

function agentsRootOf(args: { readonly cwd: string; readonly 'agents-dir'?: string }): string {
  return args['agents-dir'] === undefined ? findAgentsRoot(args.cwd) : resolve(args.cwd, args['agents-dir']);
}

const init = defineCommand({
  meta: { name: 'init', description: 'Create houserules.config.ts, the AGENTS.md section and the skills' },
  args: { ...cwdArgument, ...agentsDirArgument },
  run({ args }) {
    console.info(formatInitResult(initProject(args.cwd, agentsRootOf(args))));
  },
});

const generate = defineCommand({
  meta: { name: 'generate', description: 'Update the AGENTS.md section and the skills from the config' },
  args: { ...cwdArgument, ...agentsDirArgument, check: { type: 'boolean', description: 'Fail if generated files are out of date' } },
  run({ args }) {
    const changes = generateFiles(args.cwd, loadConfig(args.cwd).config, { check: args.check === true, agentsRoot: agentsRootOf(args) });
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
    const config = findConfigFile(args.cwd) === undefined ? undefined : loadConfig(args.cwd).config;
    const report = scanProject(args.cwd, config?.currencyWords, { roots: config?.scan?.roots });
    const output = args.json === true ? JSON.stringify({ ...report, moneyCandidates: findMoneyCandidates(report) }, null, 2) : formatScanReport(report);
    console.info(output);
  },
});

const context = defineCommand({
  meta: { name: 'context', description: 'List mapped roles or load context for selected roles' },
  args: {
    ...cwdArgument,
    list: { type: 'boolean', description: 'List mapped roles and descriptions' },
    roles: { type: 'string', description: 'Comma-separated mapped role names' },
    guidance: { type: 'boolean', description: 'Show project guidance without selecting roles' },
    project: { type: 'boolean', description: 'Include domain glossary and reference files' },
  },
  run({ args }) {
    const { config } = loadConfig(args.cwd);
    if (args.list === true) {
      const entries = Object.entries(config.roles);
      console.info(entries.length === 0 ? 'No roles are mapped. Use --guidance for project guidance.' : entries.map(([name, role]) => `- ${name}: ${role.description ?? findBuiltInRole(name)?.description ?? ''}`).join('\n'));
      return;
    }
    const names = [...new Set((args.roles ?? '').split(',').map((name) => name.trim()).filter(Boolean))];
    if (names.length === 0 && args.guidance !== true && args.project !== true) {
      console.error('Select roles with --roles or use --list or --guidance.');
      process.exitCode = 1;
      return;
    }
    const unknown = names.filter((name) => config.roles[name] === undefined);
    if (unknown.length > 0) {
      console.error(`No mapping for: ${unknown.join(', ')}. Run houserules context --list.`);
      process.exitCode = 1;
      return;
    }
    const roles = Object.fromEntries(names.map((name) => [name, config.roles[name]!]));
    console.info(renderContext(config, roles, args.project === true));
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
  meta: { name: 'houserules', version, description: 'Your design system, enforced for AI agents' },
  subCommands: { init, generate, scan, validate, context },
});

void runMain(main);

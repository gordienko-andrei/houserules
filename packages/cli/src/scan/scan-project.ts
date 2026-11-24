import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { collectDeclarations, type ComponentDeclaration, type PipeDeclaration } from './declarations';
import { collectLibraryDeclarations, type LibraryDeclarations } from './library-declarations';
import { isSourceFile, isTemplateFile, listFiles } from './project-files';
import { collectTemplateFacts, type ElementUsage, type PipeUsage, type TemplateSource, type UsageExample } from './template-facts';
import { moneyTokensOf, summarizeUsages, type UsageSummary } from './usage-summary';

export type DeclarationSource = 'project' | 'library' | 'angular' | 'unknown';

export interface ComponentFacts {
  readonly selector: string;
  readonly source: DeclarationSource;
  readonly declaredIn?: string;
  readonly declarations?: readonly string[];
  readonly inputs: readonly string[];
  readonly isDeprecated: boolean;
  readonly usage: UsageSummary;
  readonly moneyHints: readonly string[];
}

export interface PipeFacts {
  readonly name: string;
  readonly source: DeclarationSource;
  readonly declaredIn?: string;
  readonly declarations?: readonly string[];
  readonly isDeprecated: boolean;
  readonly count: number;
  readonly examples: readonly UsageExample[];
  readonly moneyHints: readonly string[];
}

export interface ScanReport {
  readonly root: string;
  readonly roots?: readonly string[];
  readonly missingDependencies?: readonly string[];
  readonly templateCount: number;
  readonly parseErrors: readonly { readonly file: string; readonly message: string }[];
  readonly components: readonly ComponentFacts[];
  readonly pipes: readonly PipeFacts[];
  readonly handFormattedMoney: { readonly count: number; readonly examples: readonly UsageExample[] };
}

const ANGULAR_PIPES = new Set(['async', 'currency', 'date', 'decimal', 'number', 'percent', 'json', 'slice', 'lowercase', 'uppercase', 'titlecase', 'keyvalue', 'i18nPlural', 'i18nSelect']);
const MAX_EXAMPLES = 5;

interface Collected {
  readonly components: ComponentDeclaration[];
  readonly pipes: PipeDeclaration[];
  readonly templates: TemplateSource[];
}

function collectSources(root: string, scanDirectories: readonly string[]): Collected {
  const collected: Collected = { components: [], pipes: [], templates: [] };
  const files = new Set(scanDirectories.flatMap((directory) => listFiles(directory, (path) => isTemplateFile(path) || isSourceFile(path))));
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const shownFile = relative(root, file).replaceAll('\\', '/');
    if (isTemplateFile(file)) {
      collected.templates.push({ file: shownFile, text, firstLine: 1 });
      continue;
    }
    const declarations = collectDeclarations(shownFile, text);
    collected.components.push(...declarations.components);
    collected.pipes.push(...declarations.pipes);
    collected.templates.push(...declarations.inlineTemplates);
  }
  return collected;
}

function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [item]);
    } else {
      group.push(item);
    }
  }
  return groups;
}

function componentFacts(collected: Collected, elements: readonly ElementUsage[], libraries: LibraryDeclarations, targets: readonly string[]): ComponentFacts[] {
  const usagesBySelector = groupBy(elements, (usage) => usage.selector);
  const declared = groupBy(collected.components.flatMap((component) => component.elementNames.map((name) => ({ name, component }))), (entry) => entry.name);
  const selectors = new Set([...declared.keys(), ...usagesBySelector.keys(), ...targets.filter((target) => libraries.elements.has(target))]);
  return [...selectors].map((selector) => {
    const matches = declared.get(selector) ?? [];
    const declaration = matches[0]?.component;
    const library = libraries.elements.get(selector);
    const declarations = [...matches.map((match) => match.component.file), ...(library ?? [])];
    const inputs = declaration?.inputs ?? [];
    return {
      selector,
      source: declaration !== undefined ? 'project' : library !== undefined ? 'library' : 'unknown',
      declaredIn: declaration?.file ?? library?.[0],
      declarations,
      inputs,
      isDeprecated: declaration?.isDeprecated ?? false,
      usage: summarizeUsages(usagesBySelector.get(selector) ?? []),
      moneyHints: [selector, declaration?.className ?? '', ...inputs].flatMap(moneyTokensOf),
    };
  });
}

function pipeFacts(collected: Collected, pipes: readonly PipeUsage[], libraries: LibraryDeclarations, targets: readonly string[]): PipeFacts[] {
  const usagesByName = groupBy(pipes, (usage) => usage.name);
  const declared = groupBy(collected.pipes, (pipe) => pipe.name);
  const names = new Set([...declared.keys(), ...usagesByName.keys(), ...targets.filter((target) => libraries.pipes.has(target) || ANGULAR_PIPES.has(target))]);
  return [...names].map((name) => {
    const matches = declared.get(name) ?? [];
    const declaration = matches[0];
    const library = libraries.pipes.get(name);
    const declarations = [...matches.map((match) => match.file), ...(library ?? [])];
    const source: DeclarationSource =
      declaration !== undefined ? 'project' : ANGULAR_PIPES.has(name) ? 'angular' : library !== undefined ? 'library' : 'unknown';
    const usages = usagesByName.get(name) ?? [];
    return {
      name,
      source,
      declaredIn: declaration?.file ?? library?.[0] ?? (source === 'angular' ? '@angular/common' : undefined),
      declarations,
      isDeprecated: declaration?.isDeprecated ?? false,
      count: usages.length,
      examples: usages.slice(0, MAX_EXAMPLES).map((usage) => usage.example),
      moneyHints: [name, declaration?.className ?? ''].flatMap(moneyTokensOf),
    };
  });
}

export function scanProject(projectRoot: string, currencyWords: readonly string[] = [], options: { roots?: readonly string[]; components?: readonly string[]; pipes?: readonly string[] } = {}): ScanReport {
  const root = resolve(projectRoot);
  const known = ['src', 'apps', 'libs', 'projects'].filter((name) => existsSync(join(root, name)));
  const angularPath = join(root, 'angular.json');
  if (existsSync(angularPath)) {
    const parsed = ts.parseConfigFileTextToJson(angularPath, readFileSync(angularPath, 'utf8'));
    if (parsed.error !== undefined) throw new Error(ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n'));
    const projects = (parsed.config as { projects?: Record<string, { sourceRoot?: unknown }> }).projects ?? {};
    for (const project of Object.values(projects)) {
      if (typeof project.sourceRoot === 'string' && existsSync(resolve(root, project.sourceRoot))) known.push(project.sourceRoot);
    }
  }
  const roots = options.roots ?? (known.length > 0 ? known : ['.']);
  const directories = roots.map((name) => {
    const directory = resolve(root, name);
    if (!existsSync(directory) || !statSync(directory).isDirectory()) throw new Error(`Scan root is not a directory: ${directory}`);
    return directory;
  });
  const collected = collectSources(root, directories);
  const facts = collected.templates.map((template) => ({ template, facts: collectTemplateFacts(template, currencyWords) }));
  const elements = facts.flatMap(({ facts: templateFacts }) => templateFacts.elements);
  const pipes = facts.flatMap(({ facts: templateFacts }) => templateFacts.pipes);
  const handFormattedMoney = facts.flatMap(({ facts: templateFacts }) => templateFacts.handFormattedMoney);
  const libraries = collectLibraryDeclarations(root);
  const byUsage = (left: { count: number }, right: { count: number }): number => right.count - left.count;
  return {
    root,
    roots,
    missingDependencies: libraries.missing,
    templateCount: collected.templates.length,
    parseErrors: facts.flatMap(({ template, facts: templateFacts }) =>
      templateFacts.parseError === undefined ? [] : [{ file: template.file, message: templateFacts.parseError }],
    ),
    components: componentFacts(collected, elements, libraries, options.components ?? []).sort((left, right) => byUsage(left.usage, right.usage)),
    pipes: pipeFacts(collected, pipes, libraries, options.pipes ?? []).sort(byUsage),
    handFormattedMoney: { count: handFormattedMoney.length, examples: handFormattedMoney.slice(0, MAX_EXAMPLES) },
  };
}

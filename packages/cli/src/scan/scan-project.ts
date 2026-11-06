import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
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
  readonly inputs: readonly string[];
  readonly isDeprecated: boolean;
  readonly usage: UsageSummary;
  readonly moneyHints: readonly string[];
}

export interface PipeFacts {
  readonly name: string;
  readonly source: DeclarationSource;
  readonly declaredIn?: string;
  readonly isDeprecated: boolean;
  readonly count: number;
  readonly examples: readonly UsageExample[];
  readonly moneyHints: readonly string[];
}

export interface ScanReport {
  readonly root: string;
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

function collectSources(root: string): Collected {
  const scanDirectory = existsSync(join(root, 'src')) ? join(root, 'src') : root;
  const collected: Collected = { components: [], pipes: [], templates: [] };
  for (const file of listFiles(scanDirectory, (path) => isTemplateFile(path) || isSourceFile(path))) {
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
    groups.set(keyOf(item), [...(groups.get(keyOf(item)) ?? []), item]);
  }
  return groups;
}

function componentFacts(collected: Collected, elements: readonly ElementUsage[], libraries: LibraryDeclarations): ComponentFacts[] {
  const usagesBySelector = groupBy(elements, (usage) => usage.selector);
  const declared = new Map(collected.components.flatMap((component) => component.elementNames.map((name) => [name, component] as const)));
  const selectors = new Set([...declared.keys(), ...usagesBySelector.keys()]);
  return [...selectors].map((selector) => {
    const declaration = declared.get(selector);
    const library = libraries.elements.get(selector);
    const inputs = declaration?.inputs ?? [];
    return {
      selector,
      source: declaration !== undefined ? 'project' : library !== undefined ? 'library' : 'unknown',
      declaredIn: declaration?.file ?? library,
      inputs,
      isDeprecated: declaration?.isDeprecated ?? false,
      usage: summarizeUsages(usagesBySelector.get(selector) ?? []),
      moneyHints: [selector, declaration?.className ?? '', ...inputs].flatMap(moneyTokensOf),
    };
  });
}

function pipeFacts(collected: Collected, pipes: readonly PipeUsage[], libraries: LibraryDeclarations): PipeFacts[] {
  const usagesByName = groupBy(pipes, (usage) => usage.name);
  const declared = new Map(collected.pipes.map((pipe) => [pipe.name, pipe] as const));
  const names = new Set([...declared.keys(), ...usagesByName.keys()]);
  return [...names].map((name) => {
    const declaration = declared.get(name);
    const library = libraries.pipes.get(name);
    const source: DeclarationSource =
      declaration !== undefined ? 'project' : ANGULAR_PIPES.has(name) ? 'angular' : library !== undefined ? 'library' : 'unknown';
    const usages = usagesByName.get(name) ?? [];
    return {
      name,
      source,
      declaredIn: declaration?.file ?? library ?? (source === 'angular' ? '@angular/common' : undefined),
      isDeprecated: declaration?.isDeprecated ?? false,
      count: usages.length,
      examples: usages.slice(0, MAX_EXAMPLES).map((usage) => usage.example),
      moneyHints: [name, declaration?.className ?? ''].flatMap(moneyTokensOf),
    };
  });
}

export function scanProject(projectRoot: string, currencyWords: readonly string[] = []): ScanReport {
  const root = resolve(projectRoot);
  const collected = collectSources(root);
  const facts = collected.templates.map((template) => ({ template, facts: collectTemplateFacts(template, currencyWords) }));
  const elements = facts.flatMap(({ facts: templateFacts }) => templateFacts.elements);
  const pipes = facts.flatMap(({ facts: templateFacts }) => templateFacts.pipes);
  const handFormattedMoney = facts.flatMap(({ facts: templateFacts }) => templateFacts.handFormattedMoney);
  const libraries = collectLibraryDeclarations(root);
  const byUsage = (left: { count: number }, right: { count: number }): number => right.count - left.count;
  return {
    root,
    templateCount: collected.templates.length,
    parseErrors: facts.flatMap(({ template, facts: templateFacts }) =>
      templateFacts.parseError === undefined ? [] : [{ file: template.file, message: templateFacts.parseError }],
    ),
    components: componentFacts(collected, elements, libraries).sort((left, right) => byUsage(left.usage, right.usage)),
    pipes: pipeFacts(collected, pipes, libraries).sort(byUsage),
    handFormattedMoney: { count: handFormattedMoney.length, examples: handFormattedMoney.slice(0, MAX_EXAMPLES) },
  };
}

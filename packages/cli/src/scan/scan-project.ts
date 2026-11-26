import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import {
  isCustomElementSelector,
  parseElementSelector,
  selectorCovers,
  splitSelectorList,
  type ElementSelector,
} from '../config/element-selector';
import { isStandardAttribute } from '../config/html-attributes';
import { collectDeclarations, type ComponentDeclaration, type PipeDeclaration } from './declarations';
import { collectLibraryDeclarations, type LibraryDeclarations } from './library-declarations';
import { isSourceFile, isTemplateFile, listFiles } from './project-files';
import { collectTemplateFacts, type AttributeUsage, type ElementUsage, type PipeUsage, type TemplateSource, type UsageExample } from './template-facts';
import { summarizeReplacements, type ReplacementSummary, type ReplacementTarget } from './replacement-summary';
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

export interface DirectiveFacts {
  readonly name: string;
  readonly source: 'project' | 'library';
  readonly declaredIn?: string;
  readonly count: number;
  readonly elements: readonly { readonly name: string; readonly count: number }[];
  readonly examples: readonly UsageExample[];
}

export interface ScanReport {
  readonly root: string;
  readonly roots?: readonly string[];
  readonly missingDependencies?: readonly string[];
  readonly templateCount: number;
  readonly inlineTemplateCount?: number;
  readonly parseErrors: readonly { readonly file: string; readonly message: string }[];
  readonly components: readonly ComponentFacts[];
  readonly directives?: readonly DirectiveFacts[];
  readonly pipes: readonly PipeFacts[];
  readonly handFormattedMoney: { readonly count: number; readonly examples: readonly UsageExample[] };
  readonly replacements?: readonly ReplacementSummary[];
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

function selectorTargetFacts(collected: Collected, usages: readonly ElementUsage[], libraries: LibraryDeclarations, target: ElementSelector): ComponentFacts {
  const covers = (selectorList: string): boolean =>
    splitSelectorList(selectorList).some((part) => {
      const declared = parseElementSelector(part);
      return declared !== undefined && selectorCovers(declared, target, isStandardAttribute);
    });
  const projectMatches = collected.components.filter((component) => covers(component.selector));
  const libraryNames = [...new Set([...libraries.attributeSelectors].filter(([selector]) => covers(selector)).flatMap(([, names]) => names))];
  const declaration = projectMatches[0];
  const inputs = declaration?.inputs ?? [];
  return {
    selector: target.source,
    source: declaration !== undefined ? 'project' : libraryNames.length > 0 ? 'library' : 'unknown',
    declaredIn: declaration?.file ?? libraryNames[0],
    declarations: [...projectMatches.map((match) => match.file), ...libraryNames],
    inputs,
    isDeprecated: declaration?.isDeprecated ?? false,
    usage: summarizeUsages(usages.filter((usage) => usage.selector === target.source)),
    moneyHints: [target.source, declaration?.className ?? '', ...inputs].flatMap(moneyTokensOf),
  };
}

function scanRoots(root: string, explicitRoots: readonly string[] | undefined): readonly string[] {
  if (explicitRoots !== undefined) return explicitRoots;
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
  return known.length > 0 ? withoutNestedRoots(known) : ['.'];
}

// `src` from the folder list and `sourceRoot: "src"` from angular.json are one root, and `projects/app/src` lies inside `projects`.
function withoutNestedRoots(roots: readonly string[]): string[] {
  const normalized = [...new Set(roots.map((name) => name.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')))];
  return normalized.filter((name) => !normalized.some((other) => other !== name && name.startsWith(`${other}/`)));
}

export interface ScanOptions {
  readonly roots?: readonly string[];
  readonly components?: readonly string[];
  readonly pipes?: readonly string[];
  readonly replaces?: readonly ReplacementTarget[];
  readonly nonComponentAttributes?: readonly string[];
}

interface DirectiveOrigin {
  readonly source: 'project' | 'library';
  readonly declaredIn: string;
}

function directiveOrigins(collected: Collected, libraries: LibraryDeclarations): Map<string, DirectiveOrigin> {
  const origins = new Map<string, DirectiveOrigin>();
  const add = (selectorList: string, origin: DirectiveOrigin): void => {
    for (const name of declaredAttributeNames([selectorList])) if (!origins.has(name)) origins.set(name, origin);
  };
  collected.components.forEach((component) => add(component.selector, { source: 'project', declaredIn: component.file }));
  libraries.attributeSelectors.forEach((names, selector) => add(selector, { source: 'library', declaredIn: names[0] ?? '' }));
  return origins;
}

// Inputs such as `appearance` carry no declaration, so only attributes some directive selects on are listed.
function directiveFacts(usages: readonly AttributeUsage[], origins: ReadonlyMap<string, DirectiveOrigin>): DirectiveFacts[] {
  const byName = new Map<string, AttributeUsage[]>();
  for (const usage of usages) byName.set(usage.name, [...(byName.get(usage.name) ?? []), usage]);
  return [...byName].flatMap(([name, found]) => {
    const origin = origins.get(name.toLowerCase());
    if (origin === undefined) return [];
    const elementCounts = new Map<string, number>();
    found.forEach((usage) => elementCounts.set(usage.element, (elementCounts.get(usage.element) ?? 0) + 1));
    return [{
      name,
      source: origin.source,
      declaredIn: origin.declaredIn,
      count: found.length,
      elements: [...elementCounts].map(([element, count]) => ({ name: element, count })).sort((left, right) => right.count - left.count),
      examples: found.slice(0, MAX_EXAMPLES).map((usage) => usage.example),
    }];
  }).sort((left, right) => right.count - left.count);
}

function declaredAttributeNames(selectorLists: Iterable<string>): Set<string> {
  const names = new Set<string>();
  for (const list of selectorLists) {
    for (const part of splitSelectorList(list)) {
      for (const condition of parseElementSelector(part)?.required ?? []) names.add(condition.name.toLowerCase());
    }
  }
  return names;
}

export function scanProject(projectRoot: string, currencyWords: readonly string[] = [], options: ScanOptions = {}): ScanReport {
  const root = resolve(projectRoot);
  const roots = scanRoots(root, options.roots);
  const directories = roots.map((name) => {
    const directory = resolve(root, name);
    if (!existsSync(directory) || !statSync(directory).isDirectory()) throw new Error(`Scan root is not a directory: ${directory}`);
    return directory;
  });
  const targets = (options.components ?? []).flatMap((component) => parseElementSelector(component) ?? []);
  const selectorTargets = targets.filter((target) => !isCustomElementSelector(target));
  const elementTargets = targets.filter(isCustomElementSelector).map((target) => target.source);
  const replaceTargets = options.replaces ?? [];
  const replaced = replaceTargets.flatMap((target) => parseElementSelector(target.selector) ?? []);
  const collected = collectSources(root, directories);
  const facts = collected.templates.map((template) => ({
    template,
    facts: collectTemplateFacts(template, currencyWords, {
      elements: selectorTargets,
      replaced,
      nonComponentAttributes: options.nonComponentAttributes,
    }),
  }));
  const elements = facts.flatMap(({ facts: templateFacts }) => templateFacts.elements);
  const targetElements = facts.flatMap(({ facts: templateFacts }) => templateFacts.targetElements);
  const replacedElements = facts.flatMap(({ facts: templateFacts }) => templateFacts.replacedElements);
  const pipes = facts.flatMap(({ facts: templateFacts }) => templateFacts.pipes);
  const handFormattedMoney = facts.flatMap(({ facts: templateFacts }) => templateFacts.handFormattedMoney);
  const libraries = collectLibraryDeclarations(root);
  const byUsage = (left: { count: number }, right: { count: number }): number => right.count - left.count;
  return {
    root,
    roots,
    missingDependencies: libraries.missing,
    templateCount: collected.templates.length,
    inlineTemplateCount: collected.templates.filter((template) => !isTemplateFile(template.file)).length,
    parseErrors: facts.flatMap(({ template, facts: templateFacts }) =>
      templateFacts.parseError === undefined ? [] : [{ file: template.file, message: templateFacts.parseError }],
    ),
    components: [
      ...componentFacts(collected, elements, libraries, elementTargets),
      ...selectorTargets.map((target) => selectorTargetFacts(collected, targetElements, libraries, target)),
    ].sort((left, right) => byUsage(left.usage, right.usage)),
    directives: directiveFacts(
      facts.flatMap(({ facts: templateFacts }) => templateFacts.attributes),
      directiveOrigins(collected, libraries),
    ),
    pipes: pipeFacts(collected, pipes, libraries, options.pipes ?? []).sort(byUsage),
    handFormattedMoney: { count: handFormattedMoney.length, examples: handFormattedMoney.slice(0, MAX_EXAMPLES) },
    ...(replaceTargets.length === 0
      ? {}
      : {
          replacements: summarizeReplacements(
            replaceTargets,
            replacedElements,
            declaredAttributeNames([...collected.components.map((component) => component.selector), ...libraries.attributeSelectors.keys()]),
          ),
        }),
  };
}

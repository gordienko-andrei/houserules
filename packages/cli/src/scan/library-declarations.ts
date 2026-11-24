import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { splitSelectorList } from '../config/element-selector';
import { elementNamesOf } from './declarations';
import { listFiles } from './project-files';

export interface LibraryDeclarations {
  readonly elements: ReadonlyMap<string, readonly string[]>;
  readonly attributeSelectors: ReadonlyMap<string, readonly string[]>;
  readonly pipes: ReadonlyMap<string, readonly string[]>;
  readonly missing: readonly string[];
}

const COMPONENT_DECLARATION = /ɵɵComponentDeclaration<[^,]+,\s*"([^"]+)"/g;
const DIRECTIVE_DECLARATION = /ɵɵDirectiveDeclaration<[^,]+,\s*"([^"]+)"/g;
const PIPE_DECLARATION = /ɵɵPipeDeclaration<[^,]+,\s*"([^"]+)"/g;
const NON_UI_PACKAGES = /^(typescript|rxjs|tslib|zone\.js|eslint.*|@types\/.*|@angular-eslint\/.*|@typescript-eslint\/.*|vitest|jest|karma.*|jasmine.*)$/;

function dependencyNames(root: string): string[] {
  const manifestPath = join(root, 'package.json');
  if (!existsSync(manifestPath)) {
    return [];
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const names = [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})];
  return names.filter((name) => !NON_UI_PACKAGES.test(name));
}

export function parseLibraryTypings(text: string): { elements: string[]; attributeSelectors: string[]; pipes: string[] } {
  const selectors = [...text.matchAll(COMPONENT_DECLARATION)].map((match) => match[1] ?? '');
  const directiveSelectors = [...text.matchAll(DIRECTIVE_DECLARATION)].map((match) => match[1] ?? '');
  const elements = selectors.flatMap(elementNamesOf);
  const attributeSelectors = [...selectors, ...directiveSelectors].flatMap(splitSelectorList).filter((part) => part.includes('['));
  const pipes = [...text.matchAll(PIPE_DECLARATION)].map((match) => match[1] ?? '');
  return { elements, attributeSelectors, pipes };
}

function addTo(map: Map<string, string[]>, key: string, library: string): void {
  map.set(key, [...new Set([...(map.get(key) ?? []), library])]);
}

export function collectLibraryDeclarations(root: string): LibraryDeclarations {
  const elements = new Map<string, string[]>();
  const attributeSelectors = new Map<string, string[]>();
  const pipes = new Map<string, string[]>();
  const missing: string[] = [];
  for (const library of dependencyNames(root)) {
    const directory = join(root, 'node_modules', library);
    if (!existsSync(directory)) {
      missing.push(library);
      continue;
    }
    for (const file of listFiles(directory, (path) => path.endsWith('.d.ts'))) {
      const found = parseLibraryTypings(readFileSync(file, 'utf8'));
      found.elements.forEach((element) => addTo(elements, element, library));
      found.attributeSelectors.forEach((selector) => addTo(attributeSelectors, selector, library));
      found.pipes.forEach((pipe) => addTo(pipes, pipe, library));
    }
  }
  return { elements, attributeSelectors, pipes, missing };
}

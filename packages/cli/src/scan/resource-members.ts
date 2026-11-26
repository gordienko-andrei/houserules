import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import ts from 'typescript';

export const DEFAULT_RESOURCE_FACTORIES: readonly string[] = ['resource', 'httpResource', 'rxResource'];

const RESOURCE_TYPE = /\b(?:Resource|ResourceRef|WritableResource|HttpResourceRef)\s*</;
const TEMPLATE_URL = /templateUrl\s*:\s*['"`]([^'"`]+)['"`]/;

interface CachedMembers {
  readonly modified: number;
  readonly factories: string;
  readonly members: ReadonlySet<string>;
}

const cache = new Map<string, CachedMembers>();

function calleeName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text;
  // `httpResource.text(...)` is a factory too.
  if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)) return expression.expression.text;
  return undefined;
}

function isResourceInitializer(initializer: ts.Expression | undefined, factories: ReadonlySet<string>): boolean {
  if (initializer === undefined || !ts.isCallExpression(initializer)) return false;
  const name = calleeName(initializer.expression);
  if (name !== undefined && factories.has(name)) return true;
  // `input.required<ResourceRef<Order[]>>()` passes a resource in.
  return initializer.typeArguments?.some((type) => RESOURCE_TYPE.test(type.getText())) ?? false;
}

function parseResourceMembers(text: string, file: string, factories: ReadonlySet<string>): Set<string> {
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const members = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyDeclaration(node) && (ts.isIdentifier(node.name) || ts.isPrivateIdentifier(node.name))) {
      const isTyped = node.type !== undefined && RESOURCE_TYPE.test(node.type.getText(sourceFile));
      if (isTyped || isResourceInitializer(node.initializer, factories)) members.add(node.name.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return members;
}

function componentFileFor(templateFile: string): string | undefined {
  if (templateFile.endsWith('.ts')) return existsSync(templateFile) ? templateFile : undefined;
  const sibling = templateFile.replace(/\.html$/, '.ts');
  if (sibling !== templateFile && existsSync(sibling)) return sibling;
  const directory = dirname(templateFile);
  if (!existsSync(directory)) return undefined;
  const templateName = basename(templateFile);
  return readdirSync(directory)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'))
    .map((name) => join(directory, name))
    .find((path) => TEMPLATE_URL.exec(readFileSync(path, 'utf8'))?.[1]?.endsWith(templateName) === true);
}

// Members of the component that hold an Angular resource, or undefined when the component file is not found.
export function findResourceMembers(
  templateFile: string,
  factories: readonly string[] = DEFAULT_RESOURCE_FACTORIES,
): ReadonlySet<string> | undefined {
  const componentFile = componentFileFor(templateFile);
  if (componentFile === undefined) return undefined;
  const modified = statSync(componentFile).mtimeMs;
  const factoryKey = factories.join(',');
  const cached = cache.get(componentFile);
  if (cached !== undefined && cached.modified === modified && cached.factories === factoryKey) return cached.members;
  const members = parseResourceMembers(readFileSync(componentFile, 'utf8'), componentFile, new Set(factories));
  cache.set(componentFile, { modified, factories: factoryKey, members });
  return members;
}

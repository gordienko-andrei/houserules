import ts from 'typescript';
import { splitSelectorList } from '../config/element-selector';
import type { TemplateSource } from './template-facts';

// Directives are kept here too: a role may target an attribute directive such as `button[pButton]`.
export interface ComponentDeclaration {
  readonly selector: string;
  readonly elementNames: readonly string[];
  readonly className: string;
  readonly file: string;
  readonly inputs: readonly string[];
  readonly isDeprecated: boolean;
}

export interface PipeDeclaration {
  readonly name: string;
  readonly className: string;
  readonly file: string;
  readonly isDeprecated: boolean;
}

export interface FileDeclarations {
  readonly components: readonly ComponentDeclaration[];
  readonly pipes: readonly PipeDeclaration[];
  readonly inlineTemplates: readonly TemplateSource[];
}

const SIGNAL_INPUT_CALLS = new Set(['input', 'input.required', 'model', 'model.required']);

function decoratorCall(node: ts.ClassDeclaration, name: string): ts.ObjectLiteralExpression | undefined {
  for (const decorator of ts.getDecorators(node) ?? []) {
    const call = decorator.expression;
    if (ts.isCallExpression(call) && ts.isIdentifier(call.expression) && call.expression.text === name) {
      const [argument] = call.arguments;
      return argument !== undefined && ts.isObjectLiteralExpression(argument) ? argument : undefined;
    }
  }
  return undefined;
}

function stringProperty(object: ts.ObjectLiteralExpression, name: string): ts.StringLiteralLike | undefined {
  for (const property of object.properties) {
    if (ts.isPropertyAssignment(property) && property.name.getText() === name) {
      return ts.isStringLiteralLike(property.initializer) ? property.initializer : undefined;
    }
  }
  return undefined;
}

function isInputMember(member: ts.ClassElement): boolean {
  if (!ts.isPropertyDeclaration(member)) {
    return false;
  }
  const hasInputDecorator = (ts.getDecorators(member) ?? []).some((decorator) =>
    decorator.expression.getText().startsWith('Input'),
  );
  const initializer = member.initializer;
  const isSignalInput =
    initializer !== undefined && ts.isCallExpression(initializer) && SIGNAL_INPUT_CALLS.has(initializer.expression.getText());
  return hasInputDecorator || isSignalInput;
}

function isDeprecated(node: ts.Node): boolean {
  return ts.getJSDocTags(node).some((tag) => tag.tagName.text === 'deprecated');
}

const CUSTOM_TAG = /^[a-z][\w]*-[\w-]*/i;

// `tui-textfield:not([multi])` and `tui-textfield[multi]` both declare the element `tui-textfield`.
export function elementNamesOf(selector: string): string[] {
  const names = splitSelectorList(selector).flatMap((part) => CUSTOM_TAG.exec(part)?.[0] ?? []);
  return [...new Set(names)];
}

function inlineTemplate(file: string, sourceFile: ts.SourceFile, literal: ts.StringLiteralLike): TemplateSource {
  const position = sourceFile.getLineAndCharacterOfPosition(literal.getStart(sourceFile) + 1);
  return { file, text: literal.text, firstLine: position.line + 1 };
}

export interface InlineTemplateSpan {
  readonly text: string;
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

// The raw text between the quotes keeps offsets equal to the source, so lint messages map back to the `.ts` file.
export function findInlineTemplates(file: string, text: string): InlineTemplateSpan[] {
  if (!text.includes('@Component')) return [];
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const templates: InlineTemplateSpan[] = [];
  const visit = (node: ts.Node): void => {
    const component = ts.isClassDeclaration(node) ? decoratorCall(node, 'Component') : undefined;
    const literal = component === undefined ? undefined : stringProperty(component, 'template');
    if (literal !== undefined) {
      const offset = literal.getStart(sourceFile) + 1;
      const position = sourceFile.getLineAndCharacterOfPosition(offset);
      templates.push({ text: text.slice(offset, literal.getEnd() - 1), offset, line: position.line + 1, column: position.character + 1 });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return templates;
}

export function collectDeclarations(file: string, text: string): FileDeclarations {
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const components: ComponentDeclaration[] = [];
  const pipes: PipeDeclaration[] = [];
  const inlineTemplates: TemplateSource[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) && node.name !== undefined) {
      const className = node.name.text;
      const component = decoratorCall(node, 'Component');
      const declaration = component ?? decoratorCall(node, 'Directive');
      const selector = declaration === undefined ? undefined : stringProperty(declaration, 'selector')?.text;
      if (declaration !== undefined && selector !== undefined) {
        const inputs = node.members.filter(isInputMember).map((member) => member.name?.getText() ?? '');
        components.push({ selector, elementNames: elementNamesOf(selector), className, file, inputs, isDeprecated: isDeprecated(node) });
      }
      const template = component === undefined ? undefined : stringProperty(component, 'template');
      if (template !== undefined) {
        inlineTemplates.push(inlineTemplate(file, sourceFile, template));
      }
      const pipe = decoratorCall(node, 'Pipe');
      const pipeName = pipe === undefined ? undefined : stringProperty(pipe, 'name')?.text;
      if (pipeName !== undefined) {
        pipes.push({ name: pipeName, className, file, isDeprecated: isDeprecated(node) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return { components, pipes, inlineTemplates };
}

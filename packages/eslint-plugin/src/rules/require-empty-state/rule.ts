import type { TSESTree } from '@typescript-eslint/utils';
import { findResourceMembers, findStaticMembers, ruleDocsUrl } from '@andrewgordienko/houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import { isForLoopBlock, type ExpressionNode, type ForLoopBlockNode, type TemplateNode } from '../../utils/template-ast';

export const RULE_NAME = 'require-empty-state';

interface WithSource extends TemplateNode {
  readonly source?: string | null;
  readonly ast?: ExpressionNode;
}

interface IfBranch extends TemplateNode {
  readonly expression: WithSource | null;
}

interface IfBlock extends TemplateNode {
  readonly branches: readonly IfBranch[];
}

const WHITESPACE = /\s+/g;
const OPTIONAL_CHAINING = /\?\./g;
const TEMPLATE_RECEIVERS = new Set(['ImplicitReceiver', 'ThisReceiver']);

function normalize(source: string): string {
  return source.replace(WHITESPACE, '').replace(OPTIONAL_CHAINING, '.');
}

function childOf(node: ExpressionNode, key: 'exp' | 'receiver'): ExpressionNode | undefined {
  const child = (node as unknown as Record<string, unknown>)[key];
  return typeof child === 'object' && child !== null ? (child as ExpressionNode) : undefined;
}

// `orders()`, `page.orders`, `orders | keyvalue` all start from the member `orders` or `page`.
function rootName(node: ExpressionNode | undefined): string | undefined {
  let current = node;
  let name: string | undefined;
  while (current !== undefined && !TEMPLATE_RECEIVERS.has(current.type)) {
    if (current.type === 'LiteralArray' || current.type === 'LiteralMap') return undefined;
    if ('name' in current && typeof current.name === 'string' && current.type !== 'BindingPipe') name = current.name;
    current = current.type === 'BindingPipe' ? childOf(current, 'exp') : childOf(current, 'receiver');
  }
  return current === undefined ? undefined : name;
}

function isInsideLoop(node: TemplateNode): boolean {
  for (let current = node.parent ?? undefined; current !== undefined; current = current.parent ?? undefined) {
    if (isForLoopBlock(current)) return true;
  }
  return false;
}

// `@if (orders().length) { @for … }` or `@if (!orders().length) { … } @else { @for … }` already handles the empty list.
function isGuardedByCondition(node: TemplateNode, collection: string): boolean {
  for (let current = node.parent ?? undefined; current !== undefined; current = current.parent ?? undefined) {
    if (current.type !== 'IfBlock') continue;
    const conditions = (current as IfBlock).branches.flatMap((branch) => (branch.expression?.source == null ? [] : [normalize(branch.expression.source)]));
    if (conditions.some((condition) => condition.includes(collection))) return true;
  }
  return false;
}

function headLoc(node: ForLoopBlockNode): TSESTree.SourceLocation {
  return { start: node.loc.start, end: { line: node.loc.start.line, column: node.loc.start.column + '@for'.length } };
}

export const requireEmptyState = createRule<[], 'missingEmpty'>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require an empty state for lists of data',
    },
    messages: {
      missingEmpty: `The list \`{{ collection }}\` has no empty state: when it is empty, the screen shows nothing. Add an \`@empty\` block or wrap the list in \`@if ({{ collection }}.length)\` with an \`@else\`. See ${ruleDocsUrl(RULE_NAME)}`,
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    ensureTemplateParser(context);
    const staticMembers = findStaticMembers(context.physicalFilename);
    // `require-async-states` already asks for the empty state of a resource.
    const resourceMembers = findResourceMembers(context.physicalFilename) ?? new Set<string>();
    const sourceText = context.sourceCode.text;

    // `orders() | slice: 0 : 3` is guarded by a check of `orders()`, so pipes are left out of the collection.
    function collectionText(node: ExpressionNode): string {
      let current = node;
      while (current.type === 'BindingPipe') current = childOf(current, 'exp') ?? current;
      return sourceText.slice(current.sourceSpan.start, current.sourceSpan.end).trim();
    }

    return {
      ForLoopBlock(node: ForLoopBlockNode) {
        if (staticMembers === undefined || node.empty !== null || isInsideLoop(node)) return;
        const expression = (node.expression as WithSource).ast;
        const root = rootName(expression);
        if (expression === undefined || root === undefined || staticMembers.has(root) || resourceMembers.has(root)) return;
        const collection = collectionText(expression);
        if (isGuardedByCondition(node, normalize(collection))) return;
        context.report({ loc: headLoc(node), messageId: 'missingEmpty', data: { collection } });
      },
    };
  },
});

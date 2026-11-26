import { ruleDocsUrl } from '@andrewgordienko/houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import { isStringConcatenation } from '../../utils/flat-text';
import { isForLoopBlock, isPropertyRead, type ExpressionNode, type TemplateNode } from '../../utils/template-ast';

export const RULE_NAME = 'no-template-arithmetic';

interface BinaryNode extends ExpressionNode {
  readonly type: 'Binary';
  readonly operation: string;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

interface LoopVariable {
  readonly name: string;
}

const ARITHMETIC = new Set(['+', '-', '*', '/', '%']);
const BINDING_TYPE_PROPERTY = 0;
const BINDING_TYPE_ATTRIBUTE = 1;
const DATA_BINDINGS = new Set([BINDING_TYPE_PROPERTY, BINDING_TYPE_ATTRIBUTE]);
const MAX_SHOWN_LENGTH = 60;
const TEMPLATE_RECEIVERS = new Set(['ImplicitReceiver', 'ThisReceiver']);

function enclosingExpression(node: TemplateNode): TemplateNode | undefined {
  let current = node.parent ?? undefined;
  while (current?.type === 'ParenthesizedExpression') current = current.parent ?? undefined;
  return current;
}

// `a + b + c` is one calculation: only its outermost part is reported, unless that part joins text.
function isPartOfCalculation(node: TemplateNode): boolean {
  const parent = enclosingExpression(node);
  return parent?.type === 'Binary' && ARITHMETIC.has((parent as BinaryNode).operation) && !isStringConcatenation(parent as BinaryNode);
}

const COMPARISONS = new Set(['<', '>', '<=', '>=', '==', '===', '!=', '!==']);

// `index < items.length - 1` decides a flag, and `step + 1` turns a position into a 1-based number: neither shows data.
function isFlagOrPosition(node: BinaryNode): boolean {
  const isOffsetByOne = (node.operation === '+' || node.operation === '-') && [node.left, node.right].some((side) => side.type === 'LiteralPrimitive' && (side as unknown as { value: unknown }).value === 1);
  if (isOffsetByOne) return true;
  for (let current = node.parent ?? undefined; current !== undefined && current.type !== 'Interpolation'; current = current.parent ?? undefined) {
    if (current.type === 'Binary' && COMPARISONS.has((current as BinaryNode).operation)) return true;
  }
  return false;
}

// Interpolations and property bindings show data; event handlers, conditions and style or class bindings do not.
function isShownValue(node: TemplateNode): boolean {
  for (let current = node.parent ?? undefined; current !== undefined; current = current.parent ?? undefined) {
    if (current.type === 'Interpolation') return true;
    if (current.type === 'BoundAttribute') return DATA_BINDINGS.has((current as unknown as { __originalType: number }).__originalType);
    if (current.type === 'BoundEvent' || current.type === 'IfBlockBranch' || current.type === 'ForLoopBlock' || current.type === 'Element') return false;
  }
  return false;
}

// `$index + 1` and `i + 1` with `let i = $index` number rows, which is layout, not data.
function loopVariables(node: TemplateNode): Set<string> {
  const names = new Set<string>();
  for (let current = node.parent ?? undefined; current !== undefined; current = current.parent ?? undefined) {
    if (!isForLoopBlock(current)) continue;
    const variables = (current as unknown as { contextVariables?: readonly LoopVariable[] }).contextVariables ?? [];
    variables.forEach((variable) => names.add(variable.name));
  }
  return names;
}

function readNames(node: ExpressionNode, names: string[] = []): string[] {
  if (isPropertyRead(node) && TEMPLATE_RECEIVERS.has(node.receiver.type)) names.push(node.name);
  for (const value of Object.values(node)) {
    if (typeof value === 'object' && value !== null && value !== node.parent && 'type' in value && 'sourceSpan' in value) {
      readNames(value as ExpressionNode, names);
    }
  }
  return names;
}

export const noTemplateArithmetic = createRule<[], 'arithmetic'>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow calculating shown values in templates',
    },
    messages: {
      arithmetic: `\`{{ expression }}\` calculates a shown value in the template. Take it from the backend or a computed signal, so every screen shows the same number. See ${ruleDocsUrl(RULE_NAME)}`,
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    ensureTemplateParser(context);
    const sourceText = context.sourceCode.text;
    return {
      Binary(node: BinaryNode) {
        if (!ARITHMETIC.has(node.operation) || isPartOfCalculation(node) || isStringConcatenation(node) || !isShownValue(node) || isFlagOrPosition(node)) return;
        const names = readNames(node);
        const loop = loopVariables(node);
        if (names.length === 0 || names.some((name) => name.startsWith('$') || loop.has(name))) return;
        const text = sourceText.slice(node.sourceSpan.start, node.sourceSpan.end).replace(/\s+/g, ' ');
        const expression = text.length > MAX_SHOWN_LENGTH ? `${text.slice(0, MAX_SHOWN_LENGTH)}…` : text;
        context.report({ loc: node.loc, messageId: 'arithmetic', data: { expression } });
      },
    };
  },
});

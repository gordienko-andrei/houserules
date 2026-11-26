import type { AbsoluteSourceSpan, ExpressionNode, InterpolationNode } from './template-ast';

export interface FlatText {
  readonly strings: readonly string[];
  readonly values: readonly ExpressionNode[];
  readonly gapSpans: readonly (readonly AbsoluteSourceSpan[])[];
  readonly listGaps: readonly number[];
}

interface LiteralNode extends ExpressionNode {
  readonly type: 'LiteralPrimitive';
  readonly value: unknown;
}

interface BinaryNode extends ExpressionNode {
  readonly type: 'Binary';
  readonly operation: string;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

interface TemplateLiteralNode extends ExpressionNode {
  readonly type: 'TemplateLiteral';
  readonly elements: readonly (ExpressionNode & { readonly text: string })[];
  readonly expressions: readonly ExpressionNode[];
}

interface ConditionalNode extends ExpressionNode {
  readonly type: 'Conditional';
  readonly trueExp: ExpressionNode;
  readonly falseExp: ExpressionNode;
}

interface WrapperNode extends ExpressionNode {
  readonly type: 'ParenthesizedExpression';
  readonly expression: ExpressionNode;
}

interface MethodCallNode extends ExpressionNode {
  readonly type: 'Call' | 'SafeCall';
  readonly receiver: ExpressionNode & { readonly name?: string; readonly receiver?: ExpressionNode };
  readonly args: readonly ExpressionNode[];
}

const SEPARATOR_EDGES = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/su;

function isStringLiteral(node: ExpressionNode): node is LiteralNode {
  return node.type === 'LiteralPrimitive' && typeof (node as LiteralNode).value === 'string';
}

function unwrap(node: ExpressionNode): ExpressionNode {
  let current = node;
  while (current.type === 'ParenthesizedExpression') {
    current = (current as WrapperNode).expression;
  }
  return current;
}

function isTextLike(node: ExpressionNode): boolean {
  const inner = unwrap(node);
  return isStringLiteral(inner) || inner.type === 'TemplateLiteral' || isConcatenation(inner);
}

function isConcatenation(node: ExpressionNode): node is BinaryNode {
  if (node.type !== 'Binary') return false;
  const binary = node as BinaryNode;
  return binary.operation === '+' && (isTextLike(binary.left) || isTextLike(binary.right));
}

function joinSeparator(node: ExpressionNode): { list: ExpressionNode; separator: LiteralNode } | undefined {
  if (node.type !== 'Call' && node.type !== 'SafeCall') return undefined;
  const call = node as MethodCallNode;
  const [separator] = call.args;
  const list = call.receiver.receiver;
  const isJoin = call.receiver.name === 'join' && call.args.length === 1 && list !== undefined;
  return isJoin && separator !== undefined && isStringLiteral(separator) ? { list, separator } : undefined;
}

class FlatTextBuilder {
  readonly strings: string[] = [''];
  readonly values: ExpressionNode[] = [];
  readonly gapSpans: AbsoluteSourceSpan[][] = [[]];
  readonly listGaps: number[] = [];

  addText(text: string, span: AbsoluteSourceSpan | undefined): void {
    this.strings[this.strings.length - 1] += text;
    if (span !== undefined) this.gapSpans.at(-1)?.push(span);
  }

  addValue(node: ExpressionNode): void {
    this.values.push(node);
    this.strings.push('');
    this.gapSpans.push([]);
  }

  // An optional piece like `note ? ' · ' + note : ''` is shown only sometimes, so its words are a field of their own.
  addOptionalLiteral(node: LiteralNode): void {
    const text = String(node.value);
    const [, head = '', core = '', tail = ''] = SEPARATOR_EDGES.exec(text) ?? [];
    if (core === '') {
      this.addText(text, node.sourceSpan);
      return;
    }
    this.addText(head, node.sourceSpan);
    this.addValue(node);
    this.addText(tail, node.sourceSpan);
  }

  expand(node: ExpressionNode, isOptional = false): void {
    const inner = unwrap(node);
    if (isStringLiteral(inner)) {
      if (isOptional) this.addOptionalLiteral(inner);
      else this.addText(String(inner.value), inner.sourceSpan);
      return;
    }
    if (isConcatenation(inner)) {
      this.expand(inner.left, isOptional);
      this.expand(inner.right, isOptional);
      return;
    }
    if (inner.type === 'TemplateLiteral') {
      this.expandTemplateLiteral(inner as TemplateLiteralNode, isOptional);
      return;
    }
    if (inner.type === 'Conditional' && this.expandConditional(inner as ConditionalNode)) {
      return;
    }
    const join = joinSeparator(inner);
    if (join !== undefined) {
      this.addValue(join.list);
      this.listGaps.push(this.strings.length - 1);
      this.addText(String(join.separator.value), join.separator.sourceSpan);
      this.addValue(join.list);
      return;
    }
    this.addValue(inner);
  }

  private expandTemplateLiteral(node: TemplateLiteralNode, isOptional: boolean): void {
    node.elements.forEach((element, index) => {
      this.addText(element.text, element.sourceSpan);
      const expression = node.expressions[index];
      if (expression !== undefined) this.expand(expression, isOptional);
    });
  }

  // Expands a conditional only when one branch is plain text: then the other branch is what the value looks like.
  private expandConditional(node: ConditionalNode): boolean {
    const trueBranch = unwrap(node.trueExp);
    const falseBranch = unwrap(node.falseExp);
    const isTrueEmpty = isStringLiteral(trueBranch) && trueBranch.value === '';
    const isFalseEmpty = isStringLiteral(falseBranch) && falseBranch.value === '';
    if (isTrueEmpty !== isFalseEmpty) {
      this.expand(isTrueEmpty ? falseBranch : trueBranch, true);
      return true;
    }
    const isTrueText = isStringLiteral(trueBranch);
    const isFalseText = isStringLiteral(falseBranch);
    if (isTrueText !== isFalseText && isTextLike(isTrueText ? falseBranch : trueBranch)) {
      this.expand(isTrueText ? falseBranch : trueBranch);
      return true;
    }
    return false;
  }
}

function gapSpan(start: number | undefined, end: number | undefined): AbsoluteSourceSpan | undefined {
  return start === undefined || end === undefined || end < start ? undefined : { start, end };
}

export function flattenInterpolation(node: InterpolationNode): FlatText {
  const builder = new FlatTextBuilder();
  node.strings.forEach((text, index) => {
    const before = node.expressions[index - 1];
    const after = node.expressions[index];
    const span = gapSpan(before?.sourceSpan.end ?? node.sourceSpan.start, after?.sourceSpan.start ?? node.sourceSpan.end);
    builder.addText(text, span);
    if (after !== undefined) builder.expand(after);
  });
  return builder;
}

export function flattenExpression(node: ExpressionNode): FlatText {
  const builder = new FlatTextBuilder();
  builder.expand(node);
  return builder;
}

export function findInGap(sourceText: string, flat: FlatText, gapIndex: number, marker: string): number | undefined {
  for (const span of flat.gapSpans[gapIndex] ?? []) {
    const index = sourceText.slice(span.start, span.end).indexOf(marker);
    if (index >= 0) return span.start + index;
  }
  return undefined;
}

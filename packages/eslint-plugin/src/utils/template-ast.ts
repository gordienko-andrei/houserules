import type { TSESTree } from '@typescript-eslint/utils';

export interface TemplateNode {
  readonly type: string;
  readonly loc: TSESTree.SourceLocation;
  readonly parent?: TemplateNode;
}

export interface AbsoluteSourceSpan {
  readonly start: number;
  readonly end: number;
}

export interface ExpressionNode extends TemplateNode {
  readonly sourceSpan: AbsoluteSourceSpan;
}

export interface BindingPipeNode extends ExpressionNode {
  readonly type: 'BindingPipe';
  readonly name: string;
  readonly exp: ExpressionNode;
}

export interface InterpolationNode extends ExpressionNode {
  readonly type: 'Interpolation';
  readonly strings: readonly string[];
  readonly expressions: readonly ExpressionNode[];
}

export function isBindingPipe(node: TemplateNode): node is BindingPipeNode {
  return node.type === 'BindingPipe';
}

export function isInterpolationInTextContent(node: TemplateNode): boolean {
  return node.type === 'Interpolation' && node.parent?.parent?.type === 'BoundText';
}

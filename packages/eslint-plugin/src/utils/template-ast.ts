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

export interface TextNode extends TemplateNode {
  readonly type: 'Text';
  readonly value: string;
}

export interface ElementNode extends TemplateNode {
  readonly type: 'Element';
  readonly name: string;
}

export interface TextAttributeNode extends TemplateNode {
  readonly type: 'TextAttribute';
  readonly name: string;
  readonly value: string;
}

export interface ExpressionWithSourceNode extends TemplateNode {
  readonly source: string | null;
}

export interface BoundAttributeNode extends TemplateNode {
  readonly type: 'BoundAttribute';
  readonly name: string;
  readonly unit: string | null;
  readonly value: ExpressionWithSourceNode;
  // template-parser replaces `type` with the node name and keeps Angular's BindingType here.
  readonly __originalType: number;
}

export interface PropertyReadNode extends ExpressionNode {
  readonly type: 'PropertyRead' | 'SafePropertyRead';
  readonly name: string;
  readonly receiver: ExpressionNode;
}

export interface CallNode extends ExpressionNode {
  readonly type: 'Call' | 'SafeCall';
  readonly receiver: ExpressionNode;
}

export interface ForLoopBlockNode extends TemplateNode {
  readonly type: 'ForLoopBlock';
  readonly expression: TemplateNode;
  readonly empty: TemplateNode | null;
}

export interface IfBlockBranchNode extends TemplateNode {
  readonly type: 'IfBlockBranch';
  readonly expression: (TemplateNode & { readonly ast: TemplateNode }) | null;
}

export interface IfBlockNode extends TemplateNode {
  readonly type: 'IfBlock';
  readonly branches: readonly IfBlockBranchNode[];
}

export function isPropertyRead(node: TemplateNode | undefined): node is PropertyReadNode {
  return node?.type === 'PropertyRead' || node?.type === 'SafePropertyRead';
}

export function isForLoopBlock(node: TemplateNode | undefined): node is ForLoopBlockNode {
  return node?.type === 'ForLoopBlock';
}

export function isElement(node: TemplateNode | undefined): node is ElementNode {
  return node?.type === 'Element';
}

export function isBindingPipe(node: TemplateNode | undefined): node is BindingPipeNode {
  return node?.type === 'BindingPipe';
}

export function isInterpolationInTextContent(node: TemplateNode): boolean {
  return node.type === 'Interpolation' && node.parent?.parent?.type === 'BoundText';
}

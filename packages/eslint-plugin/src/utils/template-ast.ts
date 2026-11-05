import type { TSESTree } from '@typescript-eslint/utils';

export interface TemplateNode {
  readonly type: string;
  readonly loc: TSESTree.SourceLocation;
}

export interface BindingPipeNode extends TemplateNode {
  readonly type: 'BindingPipe';
  readonly name: string;
}

export interface InterpolationNode extends TemplateNode {
  readonly type: 'Interpolation';
  readonly strings: readonly string[];
  readonly expressions: readonly TemplateNode[];
}

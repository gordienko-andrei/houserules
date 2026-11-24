import type { TSESTree } from '@typescript-eslint/utils';
import type { ElementNode } from '../../utils/template-ast';

export function startTagLoc(node: ElementNode): TSESTree.SourceLocation {
  const span = node.startSourceSpan;
  if (span === undefined) return node.loc;
  return {
    start: { line: span.start.line + 1, column: span.start.col },
    end: { line: span.end.line + 1, column: span.end.col },
  };
}

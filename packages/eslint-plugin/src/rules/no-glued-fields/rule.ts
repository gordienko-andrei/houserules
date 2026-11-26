import type { TSESTree } from '@typescript-eslint/utils';
import { DEFAULT_GLUE_SEPARATORS, ruleDocsUrl } from '@andrewgordienko/houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import { findInGap, flattenInterpolation, type FlatText } from '../../utils/flat-text';
import {
  hasChildren,
  isElement,
  isForLoopBlock,
  isInterpolationInTextContent,
  type ExpressionNode,
  type InterpolationNode,
  type TemplateNode,
  type TextNode,
} from '../../utils/template-ast';
import { isFollowedByValueAfterBlock, isPrecededByValueBeforeBlock } from './following-value';
import {
  findGlueBetweenValues,
  findLeadingSeparator,
  findStepsInText,
  findTrailingSeparator,
  groupSeparators,
  isSeparatorMark,
  type Glue,
  type GlueKind,
  type GlueSeparators,
} from './glued-text';
import { isScreenReaderOnly } from './screen-reader-text';

export const RULE_NAME = 'no-glued-fields';

export interface NoGluedFieldsOptions {
  readonly usages?: Readonly<Partial<Record<'metric' | 'comparison' | 'steps', string>>>;
  readonly separators?: readonly string[];
}

type Edge = 'first' | 'last';

const ROLE_BY_KIND: Readonly<Record<GlueKind, 'metric' | 'comparison' | 'steps'>> = {
  separator: 'metric',
  comparison: 'comparison',
  steps: 'steps',
};

const SEE_DOCS = `See ${ruleDocsUrl(RULE_NAME)}`;

const PREFORMATTED_ELEMENTS = new Set(['code', 'pre', 'kbd', 'samp']);

function isPreformatted(node: TemplateNode): boolean {
  return isElement(node.parent) && PREFORMATTED_ELEMENTS.has(node.parent.name);
}

function isForItemEdge(node: InterpolationNode, edge: Edge): boolean {
  const text = node.parent?.parent;
  const block = text?.parent;
  if (text === undefined || !isForLoopBlock(block) || !hasChildren(block)) return false;
  const content = block.children.filter((child) => !(child.type === 'Text' && 'value' in child && String(child.value).trim() === ''));
  return (edge === 'first' ? content.at(0) : content.at(-1)) === text;
}

function isPhrase(value: ExpressionNode | undefined): boolean {
  return value?.type === 'LiteralPrimitive';
}

// Punctuation glues two values only. Items of one list (`tags.join(', ')`) and a phrase shown on a condition
// (`{{ n }}{{ more ? ', including required points' : '' }}`) are prose, while `·`, `•` and `|` stay glue there too.
function withoutProsePunctuation(flat: FlatText, separators: GlueSeparators): string[] {
  return flat.strings.map((text, gap) => {
    const isProse = flat.listGaps.includes(gap) || isPhrase(flat.values[gap - 1]) || isPhrase(flat.values[gap]);
    return isProse && !separators.marks.some((mark) => text.includes(mark)) ? '' : text;
  });
}

function gapWithMarker(flat: FlatText, marker: string): number {
  const index = flat.strings.findIndex((text, gap) => gap > 0 && gap < flat.strings.length - 1 && text.includes(marker));
  return index < 0 ? 1 : index;
}

export const noGluedFields = createRule<[NoGluedFieldsOptions], GlueKind>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow gluing separate values into one text with separators or arrows',
    },
    messages: {
      separator: `Values are glued into one text with \`{{ marker }}\`. Lines glued with separators are a typical sign of generated markup and are not allowed, metadata lines included. Put each value in its own element{{ hint }}, space them with layout (\`gap\`) and mute the secondary ones. ${SEE_DOCS}`,
      comparison: `Two values are joined with \`{{ marker }}\`. Show the change as a comparison with before and after in separate elements{{ hint }}. ${SEE_DOCS}`,
      steps: `Steps are joined with \`{{ marker }}\`. Show them as a numbered list{{ hint }}. ${SEE_DOCS}`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          separators: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
            description: `Text that glues values when it stands between them. Default: ${DEFAULT_GLUE_SEPARATORS.map((separator) => `\`${separator}\``).join(', ')}. \`,\` and \`;\` are allowed in sentences.`,
          },
          usages: {
            type: 'object',
            properties: {
              metric: { type: 'string', minLength: 1 },
              comparison: { type: 'string', minLength: 1 },
              steps: { type: 'string', minLength: 1 },
            },
            additionalProperties: false,
            description: 'Calls of the project components for the metric, comparison and steps roles.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    ensureTemplateParser(context);
    const separators: GlueSeparators = groupSeparators(options.separators);
    const sourceText = context.sourceCode.text;

    function markerLoc(flat: FlatText, gap: number, marker: string, fallback: TSESTree.SourceLocation): TSESTree.SourceLocation {
      const index = findInGap(sourceText, flat, gap, marker);
      if (index === undefined) return fallback;
      return { start: context.sourceCode.getLocFromIndex(index), end: context.sourceCode.getLocFromIndex(index + marker.length) };
    }

    function edgeGlue(node: InterpolationNode, flat: FlatText): { glue: Glue; gap: number } | undefined {
      const trailing = findTrailingSeparator(flat.strings, separators);
      if (trailing !== undefined && (isFollowedByValueAfterBlock(node) || (isSeparatorMark(trailing.marker, separators) && isForItemEdge(node, 'last')))) {
        return { glue: trailing, gap: flat.strings.length - 1 };
      }
      const leading = findLeadingSeparator(flat.strings, separators);
      if (leading !== undefined && (isPrecededByValueBeforeBlock(node) || (isSeparatorMark(leading.marker, separators) && isForItemEdge(node, 'first')))) {
        return { glue: leading, gap: 0 };
      }
      return undefined;
    }

    function report(loc: TSESTree.SourceLocation, glue: Glue): void {
      const usage = options.usages?.[ROLE_BY_KIND[glue.kind]];
      context.report({
        loc,
        messageId: glue.kind,
        data: { marker: glue.marker, hint: usage === undefined ? '' : `, for example \`${usage}\`` },
      });
    }

    return {
      Interpolation(node: InterpolationNode) {
        if (!isInterpolationInTextContent(node) || isScreenReaderOnly(node)) {
          return;
        }
        const flat = flattenInterpolation(node);
        const glue = flat.values.length < 2 ? undefined : findGlueBetweenValues(withoutProsePunctuation(flat, separators), separators);
        if (glue !== undefined) {
          report(markerLoc(flat, gapWithMarker(flat, glue.marker), glue.marker, node.loc), glue);
          return;
        }
        const edge = edgeGlue(node, flat);
        if (edge !== undefined) {
          report(markerLoc(flat, edge.gap, edge.glue.marker, node.loc), edge.glue);
        }
      },
      Text(node: TextNode) {
        if (isPreformatted(node) || isScreenReaderOnly(node)) {
          return;
        }
        const glue = findStepsInText(node.value);
        if (glue !== undefined) {
          report(node.loc, glue);
        }
      },
    };
  },
});

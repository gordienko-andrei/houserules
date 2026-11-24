import type { TSESTree } from '@typescript-eslint/utils';
import { ruleDocsUrl } from 'houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import {
  isElement,
  isInterpolationInTextContent,
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
  type Glue,
  type GlueKind,
} from './glued-text';
import { isScreenReaderOnly } from './screen-reader-text';

export const RULE_NAME = 'no-glued-fields';

export interface NoGluedFieldsOptions {
  readonly usages?: Readonly<Partial<Record<'metric' | 'comparison' | 'steps', string>>>;
}

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

function valuesLoc(node: InterpolationNode): TSESTree.SourceLocation {
  const first = node.expressions.at(0);
  const last = node.expressions.at(-1);
  return first === undefined || last === undefined ? node.loc : { start: first.loc.start, end: last.loc.end };
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
        const glue = node.expressions.length < 2 ? undefined : findGlueBetweenValues(node.strings);
        const trailingGlue = glue === undefined ? findTrailingSeparator(node.strings) : undefined;
        const leadingGlue = glue === undefined ? findLeadingSeparator(node.strings) : undefined;
        if (glue !== undefined) {
          report(valuesLoc(node), glue);
        } else if (trailingGlue !== undefined && isFollowedByValueAfterBlock(node)) {
          report(node.expressions.at(-1)?.loc ?? node.loc, trailingGlue);
        } else if (leadingGlue !== undefined && isPrecededByValueBeforeBlock(node)) {
          report(node.expressions.at(0)?.loc ?? node.loc, leadingGlue);
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

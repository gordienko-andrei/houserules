import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import {
  isElement,
  isInterpolationInTextContent,
  type InterpolationNode,
  type TemplateNode,
  type TextNode,
} from '../../utils/template-ast';
import { findGlueBetweenValues, findStepsInText, type Glue, type GlueKind } from './glued-text';

export const RULE_NAME = 'no-glued-fields';

export interface NoGluedFieldsOptions {
  readonly usages?: Readonly<Partial<Record<'metric' | 'comparison' | 'steps', string>>>;
}

const ROLE_BY_KIND: Readonly<Record<GlueKind, 'metric' | 'comparison' | 'steps'>> = {
  separator: 'metric',
  comparison: 'comparison',
  steps: 'steps',
};

const PREFORMATTED_ELEMENTS = new Set(['code', 'pre', 'kbd', 'samp']);

function isPreformatted(node: TemplateNode): boolean {
  return isElement(node.parent) && PREFORMATTED_ELEMENTS.has(node.parent.name);
}

export const noGluedFields = createRule<[NoGluedFieldsOptions], GlueKind>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow gluing separate values into one text with separators or arrows',
    },
    messages: {
      separator: 'Values are glued into one text with `{{ marker }}`. Show each value in its own element{{ hint }}.',
      comparison:
        'Two values are joined with `{{ marker }}`. Show the change as a comparison with before and after in separate elements{{ hint }}.',
      steps: 'Steps are joined with `{{ marker }}`. Show them as a numbered list{{ hint }}.',
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

    function report(node: TemplateNode, glue: Glue): void {
      const usage = options.usages?.[ROLE_BY_KIND[glue.kind]];
      context.report({
        loc: node.loc,
        messageId: glue.kind,
        data: { marker: glue.marker, hint: usage === undefined ? '' : `, for example \`${usage}\`` },
      });
    }

    return {
      Interpolation(node: InterpolationNode) {
        if (!isInterpolationInTextContent(node) || node.expressions.length < 2) {
          return;
        }
        const glue = findGlueBetweenValues(node.strings);
        if (glue !== undefined) {
          report(node, glue);
        }
      },
      Text(node: TextNode) {
        if (isPreformatted(node)) {
          return;
        }
        const glue = findStepsInText(node.value);
        if (glue !== undefined) {
          report(node, glue);
        }
      },
    };
  },
});

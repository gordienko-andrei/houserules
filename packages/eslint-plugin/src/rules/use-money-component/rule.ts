import { ensureTemplateParser } from '@angular-eslint/utils';
import { createRule } from '../../utils/create-rule';
import type { BindingPipeNode, InterpolationNode } from '../../utils/template-ast';
import { findExpressionsNextToCurrency } from './currency-text';

export const RULE_NAME = 'use-money-component';

export interface UseMoneyComponentOptions {
  readonly component?: string;
  readonly pipes?: readonly string[];
  readonly currencyWords?: readonly string[];
}

type MessageIds = 'moneyPipe' | 'moneyNextToCurrency';

const DEFAULT_PIPES = ['currency'];
const DEFAULT_CURRENCY_WORDS: readonly string[] = [];
const GENERIC_TARGET = "the project's money component";

function describeTarget(component: string | undefined): string {
  return component === undefined ? GENERIC_TARGET : `<${component}>`;
}

export const useMoneyComponent = createRule<[UseMoneyComponentOptions], MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require money values in Angular templates to be rendered by the project money component',
    },
    messages: {
      moneyPipe: 'Show money with {{ target }} instead of the `{{ pipe }}` pipe.',
      moneyNextToCurrency:
        'Money is formatted by hand next to a currency sign. Show it with {{ target }} instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          component: {
            type: 'string',
            minLength: 1,
            description: 'Selector of the project money component, for example `ui-money`.',
          },
          pipes: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
            description: 'Pipes that format money and must not be used in templates.',
          },
          currencyWords: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
            description: 'Currency codes or words besides currency symbols, for example `USD` or `руб.`.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ pipes: DEFAULT_PIPES, currencyWords: DEFAULT_CURRENCY_WORDS }],
  create(context, [options]) {
    ensureTemplateParser(context);
    const target = describeTarget(options.component);
    const moneyPipes = new Set(options.pipes ?? DEFAULT_PIPES);
    const currencyWords = options.currencyWords ?? DEFAULT_CURRENCY_WORDS;

    return {
      BindingPipe(node: BindingPipeNode) {
        if (!moneyPipes.has(node.name)) {
          return;
        }
        context.report({
          loc: node.loc,
          messageId: 'moneyPipe',
          data: { target, pipe: node.name },
        });
      },
      Interpolation(node: InterpolationNode) {
        for (const index of findExpressionsNextToCurrency(node.strings, currencyWords)) {
          const expression = node.expressions[index];
          context.report({
            loc: expression?.loc ?? node.loc,
            messageId: 'moneyNextToCurrency',
            data: { target },
          });
        }
      },
    };
  },
});

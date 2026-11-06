import { ensureTemplateParser } from '@angular-eslint/utils';
import { createRule } from '../../utils/create-rule';
import {
  isBindingPipe,
  isInterpolationInTextContent,
  type BindingPipeNode,
  type ExpressionNode,
  type InterpolationNode,
} from '../../utils/template-ast';
import { findExpressionsNextToCurrency } from './currency-text';
import { normalizeExpression, renderUsage } from './usage';

export const RULE_NAME = 'use-money-component';

export interface UseMoneyComponentOptions {
  readonly component?: string;
  readonly pipe?: string;
  readonly usage?: string;
  readonly pipes?: readonly string[];
  readonly currencyWords?: readonly string[];
}

type MessageIds = 'moneyPipe' | 'moneyPipeUsage' | 'moneyNextToCurrency' | 'moneyNextToCurrencyUsage';

interface UsageSuggestion {
  readonly value: string;
  readonly usage: string;
}

const DEFAULT_PIPES = ['currency'];
const DEFAULT_CURRENCY_WORDS: readonly string[] = [];
const GENERIC_TARGET = "the project's money component";

function describeTarget({ component, pipe }: UseMoneyComponentOptions): string {
  if (component !== undefined) {
    return `<${component}>`;
  }
  if (pipe !== undefined) {
    return `the \`${pipe}\` pipe`;
  }
  return GENERIC_TARGET;
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
      moneyPipeUsage: 'Show `{{ value }}` with `{{ usage }}` instead of the `{{ pipe }}` pipe.',
      moneyNextToCurrency:
        'Money is formatted by hand next to a currency sign. Show it with {{ target }} instead.',
      moneyNextToCurrencyUsage:
        'Show `{{ value }}` with `{{ usage }}` instead of formatting it by hand next to a currency sign.',
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
          pipe: {
            type: 'string',
            minLength: 1,
            description: 'Name of the project money pipe, for example `tuiAmount`. Use it instead of `component`.',
          },
          usage: {
            type: 'string',
            pattern: '\\$value',
            description: 'How to show a money value, with `$value` in place of the expression.',
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
        not: { type: 'object', required: ['component', 'pipe'] },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ pipes: DEFAULT_PIPES, currencyWords: DEFAULT_CURRENCY_WORDS }],
  create(context, [options]) {
    ensureTemplateParser(context);
    const target = describeTarget(options);
    const sourceText = context.sourceCode.text;
    const moneyPipes = new Set((options.pipes ?? DEFAULT_PIPES).filter((name) => name !== options.pipe));
    const unwrappedPipes = new Set(options.pipe === undefined ? moneyPipes : [...moneyPipes, options.pipe]);
    const currencyWords = options.currencyWords ?? DEFAULT_CURRENCY_WORDS;

    function suggestUsage(expression: ExpressionNode): UsageSuggestion | undefined {
      if (options.usage === undefined) {
        return undefined;
      }
      const valueNode =
        isBindingPipe(expression) && unwrappedPipes.has(expression.name) ? expression.exp : expression;
      const valueText = sourceText.slice(valueNode.sourceSpan.start, valueNode.sourceSpan.end);
      const usage = renderUsage(options.usage, valueText);
      return usage === undefined ? undefined : { value: normalizeExpression(valueText), usage };
    }

    return {
      BindingPipe(node: BindingPipeNode) {
        if (!moneyPipes.has(node.name)) {
          return;
        }
        const isWholeInterpolation = node.parent !== undefined && isInterpolationInTextContent(node.parent);
        const suggestion = isWholeInterpolation ? suggestUsage(node.exp) : undefined;
        if (suggestion === undefined) {
          context.report({ loc: node.loc, messageId: 'moneyPipe', data: { target, pipe: node.name } });
          return;
        }
        context.report({ loc: node.loc, messageId: 'moneyPipeUsage', data: { ...suggestion, pipe: node.name } });
      },
      Interpolation(node: InterpolationNode) {
        const isTextContent = isInterpolationInTextContent(node);
        for (const index of findExpressionsNextToCurrency(node.strings, currencyWords)) {
          const expression = node.expressions[index];
          const suggestion = isTextContent && expression !== undefined ? suggestUsage(expression) : undefined;
          const loc = expression?.loc ?? node.loc;
          if (suggestion === undefined) {
            context.report({ loc, messageId: 'moneyNextToCurrency', data: { target } });
            continue;
          }
          context.report({ loc, messageId: 'moneyNextToCurrencyUsage', data: { ...suggestion } });
        }
      },
    };
  },
});

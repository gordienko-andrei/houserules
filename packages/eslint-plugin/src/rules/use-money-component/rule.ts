import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import { createRule } from '../../utils/create-rule';
import { flattenExpression, flattenInterpolation, type FlatText } from '../../utils/flat-text';
import {
  isBindingPipe,
  isInterpolation,
  isInterpolationInTextContent,
  type BindingPipeNode,
  type BoundAttributeNode,
  type ElementNode,
  type ExpressionNode,
  type InterpolationNode,
} from '../../utils/template-ast';
import { describeElementSelector, findAmountsNextToCurrencyCode, findExpressionsNextToCurrency } from '@andrewgordienko/houserules';
import { valuesNextToCurrencyElement } from './currency-element';
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
const FORMATTING_PIPES = new Set(['number', 'decimal', 'percent']);
const DEFAULT_CURRENCY_WORDS: readonly string[] = [];
const GENERIC_TARGET = "the project's money component";

function describeTarget({ component, pipe }: UseMoneyComponentOptions): string {
  if (component !== undefined) {
    return describeElementSelector(component);
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
        'Money is formatted by hand next to a currency sign or code. Show it with {{ target }} instead.',
      moneyNextToCurrencyUsage:
        'Show `{{ value }}` with `{{ usage }}` instead of formatting it by hand next to a currency sign or code.',
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

    function moneyValues(flat: FlatText): ExpressionNode[] {
      const expressions = flat.values.map((value) => sourceText.slice(value.sourceSpan.start, value.sourceSpan.end));
      const indexes = new Set([
        ...findExpressionsNextToCurrency(flat.strings, currencyWords),
        ...findAmountsNextToCurrencyCode(flat.strings, expressions),
      ]);
      return [...indexes]
        .sort((left, right) => left - right)
        .flatMap((index) => flat.values[index] ?? [])
        .filter((value) => value.type !== 'LiteralPrimitive');
    }

    // The money component formats the amount itself, so `number` or `currency` around it would hand it a string.
    function amountOf(expression: ExpressionNode): ExpressionNode {
      let current = expression;
      while (isBindingPipe(current) && (unwrappedPipes.has(current.name) || FORMATTING_PIPES.has(current.name))) {
        current = current.exp;
      }
      return current;
    }

    function suggestUsage(expression: ExpressionNode): UsageSuggestion | undefined {
      if (options.usage === undefined) {
        return undefined;
      }
      const valueNode = amountOf(expression);
      const valueText = sourceText.slice(valueNode.sourceSpan.start, valueNode.sourceSpan.end);
      const usage = renderUsage(options.usage, valueText);
      return usage === undefined ? undefined : { value: normalizeExpression(valueText), usage };
    }

    function reportHandFormatted(value: ExpressionNode, canSuggest: boolean): void {
      const suggestion = canSuggest ? suggestUsage(value) : undefined;
      if (suggestion === undefined) {
        context.report({ loc: value.loc, messageId: 'moneyNextToCurrency', data: { target } });
        return;
      }
      context.report({ loc: value.loc, messageId: 'moneyNextToCurrencyUsage', data: { ...suggestion } });
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
        for (const value of moneyValues(flattenInterpolation(node))) {
          reportHandFormatted(value, isTextContent);
        }
      },
      BoundAttribute(node: BoundAttributeNode) {
        const expression = node.value.ast;
        if (expression === undefined || isInterpolation(expression)) {
          return;
        }
        for (const value of moneyValues(flattenExpression(expression))) {
          reportHandFormatted(value, false);
        }
      },
      Element(node: ElementNode) {
        for (const value of valuesNextToCurrencyElement(node, currencyWords)) {
          reportHandFormatted(value, true);
        }
      },
    };
  },
});

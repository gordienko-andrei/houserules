import { ruleDocsUrl } from '@andrewgordienko/houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import { isInterpolationInTextContent, type InterpolationNode } from '../../utils/template-ast';
import { findPluralNounAfterValue } from './plural-noun';

export const RULE_NAME = 'no-hardcoded-plural';

export interface NoHardcodedPluralOptions {
  readonly ignoreWords?: readonly string[];
}

export const noHardcodedPlural = createRule<[NoHardcodedPluralOptions], 'hardcodedPlural'>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow a number followed by a fixed English plural noun',
    },
    messages: {
      hardcodedPlural: `\`{{ value }} {{ phrase }}\` reads "1 {{ phrase }}" when the value is 1. Use ICU (\`{count, plural, =1 {one item} other {# items}}\`) or the \`i18nPlural\` pipe. See ${ruleDocsUrl(RULE_NAME)}`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreWords: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
            description: 'Words ending in `s` that are not plural nouns in your texts, for example `canvas`.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    ensureTemplateParser(context);
    const ignoredWords = new Set((options.ignoreWords ?? []).map((word) => word.toLowerCase()));
    const sourceText = context.sourceCode.text;
    return {
      Interpolation(node: InterpolationNode) {
        if (!isInterpolationInTextContent(node)) return;
        // Values are read as written: `n === 1 ? 'item' : n + ' items'` already handles the singular.
        node.expressions.forEach((value, index) => {
          if (value.type === 'LiteralPrimitive' || value.type === 'Conditional') return;
          const plural = findPluralNounAfterValue(node.strings[index + 1] ?? '', ignoredWords, node.strings[index] ?? '');
          if (plural === undefined) return;
          const shown = sourceText.slice(value.sourceSpan.start, value.sourceSpan.end).trim();
          context.report({ loc: value.loc, messageId: 'hardcodedPlural', data: { value: `{{ ${shown} }}`, phrase: plural.phrase } });
        });
      },
    };
  },
});

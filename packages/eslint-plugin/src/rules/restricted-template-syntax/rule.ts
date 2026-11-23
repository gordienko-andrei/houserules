import type { TSESTree } from '@typescript-eslint/utils';
import { ruleDocsUrl } from 'houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import type { TemplateNode } from '../../utils/template-ast';

export const RULE_NAME = 'restricted-template-syntax';

export interface TemplateRestriction {
  readonly selector: string;
  readonly message: string;
}

export interface RestrictedTemplateSyntaxOptions {
  readonly restrictions?: readonly TemplateRestriction[];
}

function messagesBySelector(restrictions: readonly TemplateRestriction[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const { selector, message } of restrictions) grouped.set(selector, [...(grouped.get(selector) ?? []), message]);
  return grouped;
}

// Own rule instead of no-restricted-syntax: in flat config a later no-restricted-syntax block replaces the options of earlier ones.
export const restrictedTemplateSyntax = createRule<[RestrictedTemplateSyntaxOptions], 'restricted'>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow template syntax listed in the project restrictions',
    },
    messages: {
      restricted: '{{ message }}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          restrictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                selector: { type: 'string', minLength: 1 },
                message: { type: 'string', minLength: 1 },
              },
              required: ['selector', 'message'],
              additionalProperties: false,
            },
            description: `ESLint selectors over the template AST and their messages. See ${ruleDocsUrl(RULE_NAME)}`,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ restrictions: [] }],
  create(context, [options]) {
    ensureTemplateParser(context);
    const listeners: Record<string, (node: TemplateNode) => void> = {};
    for (const [selector, messages] of messagesBySelector(options.restrictions ?? [])) {
      listeners[selector] = (node) => {
        for (const message of messages) context.report({ loc: node.loc as TSESTree.SourceLocation, messageId: 'restricted', data: { message } });
      };
    }
    return listeners;
  },
});

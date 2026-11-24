import { describeElementSelector, elementFactsOf, isPlainNativeMatch, parseElementSelector, ruleDocsUrl, type ElementSelector } from 'houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import type { ElementNode } from '../../utils/template-ast';
import { startTagLoc } from './start-tag-loc';

export const RULE_NAME = 'prefer-role-component';

export interface Replacement {
  readonly role: string;
  readonly selector: string;
  readonly component: string;
  readonly usage: string;
}

export interface PreferRoleComponentOptions {
  readonly replacements?: readonly Replacement[];
}

interface ParsedReplacement extends Replacement {
  readonly parsed: ElementSelector;
}

function parseReplacements(replacements: readonly Replacement[]): ParsedReplacement[] {
  return replacements.map((replacement) => {
    const parsed = parseElementSelector(replacement.selector);
    if (parsed === undefined) {
      throw new Error(`houserules/${RULE_NAME}: unsupported selector \`${replacement.selector}\` in role \`${replacement.role}\`.`);
    }
    return { ...replacement, parsed };
  });
}

export const preferRoleComponent = createRule<[PreferRoleComponentOptions], 'nativeElement'>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require the role component instead of the native elements it replaces',
    },
    messages: {
      nativeElement: `Native \`<{{ element }}>\` matches \`{{ selector }}\`, which the \`{{ role }}\` role replaces. Use {{ component }} as in \`{{ usage }}\`. See ${ruleDocsUrl(RULE_NAME)}`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          replacements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', minLength: 1 },
                selector: { type: 'string', minLength: 1 },
                component: { type: 'string', minLength: 1 },
                usage: { type: 'string', minLength: 1 },
              },
              required: ['role', 'selector', 'component', 'usage'],
              additionalProperties: false,
            },
            description: 'Native element selectors and the role components used instead of them.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ replacements: [] }],
  create(context, [options]) {
    ensureTemplateParser(context);
    const replacements = parseReplacements(options.replacements ?? []);
    return {
      Element(node: ElementNode) {
        const facts = elementFactsOf(node);
        const replacement = replacements.find((candidate) => isPlainNativeMatch(candidate.parsed, facts));
        if (replacement === undefined) return;
        context.report({
          loc: startTagLoc(node),
          messageId: 'nativeElement',
          data: {
            element: node.name,
            selector: replacement.selector,
            role: replacement.role,
            component: describeElementSelector(replacement.component),
            usage: replacement.usage,
          },
        });
      },
    };
  },
});

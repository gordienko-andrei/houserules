import { describeElementSelector, ruleDocsUrl } from '@andrewgordienko/houserules';
import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import {
  isInterpolationInTextContent,
  isPropertyRead,
  type BindingPipeNode,
  type CallNode,
  type ExpressionNode,
} from '../../utils/template-ast';
import { normalizeExpression, renderUsage } from '../use-money-component/usage';

export const RULE_NAME = 'use-format-role';

export interface FormatRoleOption {
  readonly role: string;
  readonly angularPipe: string;
  readonly defaultFormat: string;
  readonly formattingMethods: readonly string[];
  readonly component?: string;
  readonly pipe?: string;
  readonly usage: string;
  readonly formats?: readonly string[];
}

export interface UseFormatRoleOptions {
  readonly roles?: readonly FormatRoleOption[];
}

type MessageIds = 'useRole' | 'useRoleUsage' | 'formatNotAllowed' | 'formattingMethod';

interface LiteralNode extends ExpressionNode {
  readonly type: 'LiteralPrimitive';
  readonly value: unknown;
}

function isStringLiteral(node: ExpressionNode | undefined): node is LiteralNode {
  return node?.type === 'LiteralPrimitive' && typeof (node as LiteralNode).value === 'string';
}

function describeTarget(role: FormatRoleOption): string {
  return role.component === undefined ? `the \`${role.pipe ?? ''}\` pipe` : describeElementSelector(role.component);
}

// The format of `x | date: 'd MMM'`, the default of the pipe without an argument, or undefined when it is not a literal.
function formatOf(node: BindingPipeNode, role: FormatRoleOption): string | undefined {
  const [format] = node.args;
  if (format === undefined) return role.defaultFormat;
  return isStringLiteral(format) ? String(format.value) : undefined;
}

export const useFormatRole = createRule<[UseFormatRoleOptions], MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require dates, numbers and percents to be shown by the role the project maps for them',
    },
    messages: {
      useRole: `Show the {{ role }} with {{ target }} instead of the \`{{ pipe }}\` pipe. See ${ruleDocsUrl(RULE_NAME)}`,
      useRoleUsage: `Show \`{{ value }}\` with \`{{ usage }}\` instead of the \`{{ pipe }}\` pipe. See ${ruleDocsUrl(RULE_NAME)}`,
      formatNotAllowed: `The \`{{ pipe }}\` pipe uses the format \`{{ format }}\`, which the \`{{ role }}\` role does not allow. Use one of: {{ formats }}. See ${ruleDocsUrl(RULE_NAME)}`,
      formattingMethod: `\`{{ method }}()\` formats a {{ role }} by hand. Show it with {{ target }}, as in \`{{ usage }}\`. See ${ruleDocsUrl(RULE_NAME)}`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', minLength: 1 },
                angularPipe: { type: 'string', minLength: 1 },
                defaultFormat: { type: 'string' },
                formattingMethods: { type: 'array', items: { type: 'string', minLength: 1 } },
                component: { type: 'string', minLength: 1 },
                pipe: { type: 'string', minLength: 1 },
                usage: { type: 'string', minLength: 1 },
                formats: { type: 'array', items: { type: 'string' }, minItems: 1 },
              },
              required: ['role', 'angularPipe', 'defaultFormat', 'formattingMethods', 'usage'],
              additionalProperties: false,
            },
            description: 'The mapped `date`, `number` and `percent` roles with the Angular pipe each one replaces.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ roles: [] }],
  create(context, [options]) {
    ensureTemplateParser(context);
    const sourceText = context.sourceCode.text;
    const roles = options.roles ?? [];

    function textOf(node: ExpressionNode): string {
      return sourceText.slice(node.sourceSpan.start, node.sourceSpan.end);
    }

    function reportReplacedPipe(node: BindingPipeNode, role: FormatRoleOption): void {
      const isWholeInterpolation = node.parent !== undefined && isInterpolationInTextContent(node.parent);
      const usage = isWholeInterpolation ? renderUsage(role.usage, textOf(node.exp)) : undefined;
      if (usage === undefined) {
        context.report({ loc: node.loc, messageId: 'useRole', data: { role: role.role, target: describeTarget(role), pipe: node.name } });
        return;
      }
      context.report({ loc: node.loc, messageId: 'useRoleUsage', data: { value: normalizeExpression(textOf(node.exp)), usage, pipe: node.name } });
    }

    function checkFormat(node: BindingPipeNode, role: FormatRoleOption): void {
      const format = formatOf(node, role);
      if (role.formats === undefined || format === undefined || role.formats.includes(format)) return;
      context.report({
        loc: node.loc,
        messageId: 'formatNotAllowed',
        data: { pipe: node.name, format, role: role.role, formats: role.formats.map((item) => `\`'${item}'\``).join(', ') },
      });
    }

    return {
      BindingPipe(node: BindingPipeNode) {
        const role = roles.find((candidate) => candidate.angularPipe === node.name);
        if (role === undefined) return;
        if (role.pipe === role.angularPipe) {
          checkFormat(node, role);
          return;
        }
        reportReplacedPipe(node, role);
      },
      Call(node: CallNode) {
        if (!isPropertyRead(node.receiver)) return;
        const method = node.receiver.name;
        const role = roles.find((candidate) => candidate.formattingMethods.includes(method));
        if (role === undefined) return;
        context.report({
          loc: node.loc,
          messageId: 'formattingMethod',
          data: { method, role: role.role, target: describeTarget(role), usage: role.usage },
        });
      },
    };
  },
});

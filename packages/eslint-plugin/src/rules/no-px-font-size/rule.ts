import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import type { BoundAttributeNode, TextAttributeNode } from '../../utils/template-ast';
import { FONT_STYLE_BINDINGS, hasPxFontSizeClass, hasPxFontSizeInCss, hasPxFontSizeInStyleMap, hasPxInExpression } from './px-font-size';

export const RULE_NAME = 'no-px-font-size';

const BINDING_TYPE_PROPERTY = 0;
const BINDING_TYPE_ATTRIBUTE = 1;
const BINDING_TYPE_CLASS = 2;
const BINDING_TYPE_STYLE = 3;
const STYLE_MAP_PROPERTIES = new Set(['style', 'ngStyle']);
const CLASS_LIST_PROPERTIES = new Set(['class', 'className', 'ngClass']);

function hasPxFontSize(node: BoundAttributeNode): boolean {
  const source = node.value.source ?? '';
  switch (node.__originalType) {
    case BINDING_TYPE_STYLE:
      return FONT_STYLE_BINDINGS.has(node.name) && (node.unit === 'px' || hasPxInExpression(source));
    case BINDING_TYPE_PROPERTY:
      return (
        (STYLE_MAP_PROPERTIES.has(node.name) && hasPxFontSizeInStyleMap(source)) ||
        (CLASS_LIST_PROPERTIES.has(node.name) && hasPxFontSizeClass(source))
      );
    case BINDING_TYPE_ATTRIBUTE:
      return (node.name === 'style' && hasPxFontSizeInCss(source)) || (node.name === 'class' && hasPxFontSizeClass(source));
    case BINDING_TYPE_CLASS:
      return hasPxFontSizeClass(node.name);
    default:
      return false;
  }
}

export const noPxFontSize = createRule<[], 'pxFontSize'>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow font sizes in fixed px in Angular templates',
    },
    messages: {
      pxFontSize:
        'Font size is set in fixed `px`. Use `rem` or a typography class of the project, so text scales up to 200% (WCAG 1.4.4).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    ensureTemplateParser(context);
    return {
      TextAttribute(node: TextAttributeNode) {
        const isPx = node.name === 'style' ? hasPxFontSizeInCss(node.value) : node.name === 'class' && hasPxFontSizeClass(node.value);
        if (isPx) {
          context.report({ loc: node.loc, messageId: 'pxFontSize' });
        }
      },
      BoundAttribute(node: BoundAttributeNode) {
        if (hasPxFontSize(node)) {
          context.report({ loc: node.loc, messageId: 'pxFontSize' });
        }
      },
    };
  },
});

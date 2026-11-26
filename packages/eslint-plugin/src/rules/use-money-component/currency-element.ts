import { isCurrencyMarker } from '@andrewgordienko/houserules';
import { flattenInterpolation } from '../../utils/flat-text';
import {
  hasChildren,
  isBoundText,
  isElement,
  isInterpolation,
  type ElementNode,
  type ExpressionNode,
  type TemplateNode,
} from '../../utils/template-ast';

type Side = 'start' | 'end';

function isBlank(node: TemplateNode): boolean {
  return node.type === 'Text' && 'value' in node && String(node.value).trim() === '';
}

function contentOf(node: TemplateNode): TemplateNode[] {
  return hasChildren(node) ? node.children.filter((child) => !isBlank(child)) : [];
}

function isCurrencyElement(node: ElementNode, currencyWords: readonly string[]): boolean {
  const [only, ...rest] = contentOf(node);
  return rest.length === 0 && only?.type === 'Text' && 'value' in only && isCurrencyMarker(String(only.value), currencyWords);
}

// The value at the side of a neighbour that touches the currency element: `<span>£</span>{{ amount }}`.
function valueAtSide(node: TemplateNode | undefined, side: Side): ExpressionNode | undefined {
  if (node === undefined) return undefined;
  if (isElement(node)) {
    const [only, ...rest] = contentOf(node);
    return rest.length === 0 ? valueAtSide(only, side) : undefined;
  }
  const interpolation = isBoundText(node) ? node.value.ast : undefined;
  if (!isInterpolation(interpolation)) return undefined;
  const flat = flattenInterpolation(interpolation);
  const edgeText = side === 'start' ? flat.strings.at(0) : flat.strings.at(-1);
  const value = side === 'start' ? flat.values.at(0) : flat.values.at(-1);
  return edgeText?.trim() === '' && value?.type !== 'LiteralPrimitive' ? value : undefined;
}

export function valuesNextToCurrencyElement(node: ElementNode, currencyWords: readonly string[]): ExpressionNode[] {
  const parent = node.parent;
  if (!hasChildren(parent) || !isCurrencyElement(node, currencyWords)) return [];
  const siblings = parent.children.filter((child) => !isBlank(child));
  const index = siblings.indexOf(node);
  const values = [valueAtSide(siblings[index - 1], 'end'), valueAtSide(siblings[index + 1], 'start')];
  return values.filter((value) => value !== undefined);
}

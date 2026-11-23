import {
  hasChildren,
  isBoundText,
  isInterpolation,
  type InterpolationNode,
  type TemplateNode,
} from '../../utils/template-ast';

function isBlank(node: TemplateNode): boolean {
  return node.type === 'Text' && 'value' in node && typeof node.value === 'string' && node.value.trim() === '';
}

function isLastContent(node: TemplateNode, parent: TemplateNode): boolean {
  return hasChildren(parent) && parent.children.filter((child) => !isBlank(child)).at(-1) === node;
}

function isFirstContent(node: TemplateNode, parent: TemplateNode): boolean {
  return hasChildren(parent) && parent.children.find((child) => !isBlank(child)) === node;
}

function nextContent(node: TemplateNode): TemplateNode | undefined {
  const parent = node.parent;
  if (!hasChildren(parent)) {
    return undefined;
  }
  return parent.children.slice(parent.children.indexOf(node) + 1).find((child) => !isBlank(child));
}

function previousContent(node: TemplateNode): TemplateNode | undefined {
  const parent = node.parent;
  if (!hasChildren(parent)) {
    return undefined;
  }
  return parent.children.slice(0, parent.children.indexOf(node)).filter((child) => !isBlank(child)).at(-1);
}

function startsWithValue(node: TemplateNode | undefined): boolean {
  const interpolation = isBoundText(node) ? node.value.ast : undefined;
  return isInterpolation(interpolation) && interpolation.expressions.length > 0 && (interpolation.strings[0] ?? '').trim() === '';
}

function endsWithValue(node: TemplateNode | undefined): boolean {
  const interpolation = isBoundText(node) ? node.value.ast : undefined;
  return isInterpolation(interpolation) && interpolation.expressions.length > 0 && (interpolation.strings.at(-1) ?? '').trim() === '';
}

// Only @if branches: in @for a trailing separator joins items of one list, not two different values.
export function isFollowedByValueAfterBlock(interpolation: InterpolationNode): boolean {
  let node = interpolation.parent?.parent;
  let blocksLeft = 0;
  while (node?.parent?.type === 'IfBlockBranch' && isLastContent(node, node.parent)) {
    node = node.parent.parent;
    blocksLeft++;
  }
  return node !== undefined && blocksLeft > 0 && startsWithValue(nextContent(node));
}

export function isPrecededByValueBeforeBlock(interpolation: InterpolationNode): boolean {
  let node = interpolation.parent?.parent;
  let blocksEntered = 0;
  while (node?.parent?.type === 'IfBlockBranch' && isFirstContent(node, node.parent)) {
    node = node.parent.parent;
    blocksEntered++;
  }
  return node !== undefined && blocksEntered > 0 && endsWithValue(previousContent(node));
}

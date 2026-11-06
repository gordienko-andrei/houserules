import { isElement, type TemplateNode } from '../../utils/template-ast';

const SCREEN_READER_ONLY_CLASSES = new Set(['sr-only', 'visually-hidden', 'cdk-visually-hidden']);

function hasScreenReaderOnlyClass(node: TemplateNode): boolean {
  return (
    isElement(node) &&
    node.attributes.some(
      (attribute) => attribute.name === 'class' && attribute.value.split(/\s+/).some((name) => SCREEN_READER_ONLY_CLASSES.has(name)),
    )
  );
}

export function isScreenReaderOnly(node: TemplateNode): boolean {
  // The root node has `parent: null` at runtime, not undefined.
  for (let current = node.parent ?? undefined; current !== undefined; current = current.parent ?? undefined) {
    if (hasScreenReaderOnlyClass(current)) {
      return true;
    }
  }
  return false;
}

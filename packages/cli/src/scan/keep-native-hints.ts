import type { ReplacedElement } from './template-facts';

export interface KeepNativeHint {
  readonly selector: string;
  readonly reason: string;
  readonly count: number;
}

const MIN_GROUP = 3;
const MAX_HINTS = 3;
// A button inside a `div` says nothing about why it is native; one inside a `th` usually sorts a column.
const LAYOUT_CONTAINERS = new Set([
  'div', 'span', 'p', 'section', 'article', 'aside', 'main', 'header', 'footer', 'form', 'label', 'ul', 'ol', 'li',
  'ng-container', 'ng-template',
]);

function countBy(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

// Groups of reported elements that may be native on purpose, with the `:not(...)` that would keep them.
export function findKeepNativeHints(reported: readonly ReplacedElement[]): KeepNativeHint[] {
  const parents = countBy(reported.flatMap((element) => (element.parent === undefined || LAYOUT_CONTAINERS.has(element.parent) ? [] : [element.parent])));
  const classes = countBy(reported.flatMap((element) => [...new Set(element.classes)]));
  const hints = [
    ...[...parents].map(([tag, count]) => ({ selector: `:not(${tag} > *)`, reason: `inside <${tag}>`, count })),
    ...[...classes].map(([name, count]) => ({ selector: `:not(.${name})`, reason: `with class ${name}`, count })),
  ];
  return hints
    .filter((hint) => hint.count >= MIN_GROUP)
    .sort((left, right) => right.count - left.count || left.selector.localeCompare(right.selector))
    .slice(0, MAX_HINTS);
}

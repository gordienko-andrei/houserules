import { minimatch } from 'minimatch';
import type { ReplacedElement, UsageExample } from './template-facts';

export interface DirectiveCount {
  readonly name: string;
  readonly count: number;
}

export interface ReplacementTarget {
  readonly selector: string;
  readonly ignoredFiles?: readonly string[];
}

export interface ReplacementSummary {
  readonly selector: string;
  readonly reported: number;
  readonly examples: readonly UsageExample[];
  readonly skipped: number;
  readonly directives: readonly DirectiveCount[];
  readonly undeclaredAttributes: readonly string[];
}

const MAX_EXAMPLES = 3;
const MAX_DIRECTIVES = 5;

function countDirectives(elements: readonly ReplacedElement[]): DirectiveCount[] {
  const counts = new Map<string, number>();
  for (const name of elements.flatMap((element) => element.directives)) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, MAX_DIRECTIVES);
}

// The role files are excluded the same way ESLint excludes them, so the counts match what the linter reports.
function isIgnored(file: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => minimatch(file, pattern, { dot: true }));
}

// Attributes that no directive of the project or its libraries selects on are inputs, so they should not skip an element.
function undeclaredAttributes(directives: readonly DirectiveCount[], declared: ReadonlySet<string> | undefined): string[] {
  if (declared === undefined || declared.size === 0) return [];
  return directives.map((directive) => directive.name).filter((name) => !declared.has(name.toLowerCase()));
}

export function summarizeReplacements(
  targets: readonly ReplacementTarget[],
  elements: readonly ReplacedElement[],
  declaredAttributes?: ReadonlySet<string>,
): ReplacementSummary[] {
  return targets.map(({ selector, ignoredFiles = [] }) => {
    const matched = elements.filter((element) => element.selector === selector && !isIgnored(element.example.file, ignoredFiles));
    const reported = matched.filter((element) => element.directives.length === 0);
    const skipped = matched.filter((element) => element.directives.length > 0);
    const directives = countDirectives(skipped);
    return {
      selector,
      reported: reported.length,
      examples: reported.slice(0, MAX_EXAMPLES).map((element) => element.example),
      skipped: skipped.length,
      directives,
      undeclaredAttributes: undeclaredAttributes(directives, declaredAttributes),
    };
  });
}

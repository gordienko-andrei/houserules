export type GlueKind = 'separator' | 'comparison' | 'steps';

export interface Glue {
  readonly kind: GlueKind;
  readonly marker: string;
}

import { DEFAULT_GLUE_SEPARATORS } from '@andrewgordienko/houserules';

export interface GlueSeparators {
  readonly marks: readonly string[];
  readonly punctuation: readonly string[];
}

const SENTENCE_PUNCTUATION = new Set([',', ';']);

export function groupSeparators(separators: readonly string[] = DEFAULT_GLUE_SEPARATORS): GlueSeparators {
  return {
    marks: separators.filter((separator) => !SENTENCE_PUNCTUATION.has(separator)),
    punctuation: separators.filter((separator) => SENTENCE_PUNCTUATION.has(separator)),
  };
}

const DEFAULT_GROUPS = groupSeparators();
const ARROW = /→|⇒|⟶|➔|➝|->|=>/g;
const SENTENCE_END = /[.!?…]$/;
const CAPITALISED = /^\p{Lu}/u;
const MIN_STEP_ARROWS = 2;
const MAX_MENU_ITEM_WORDS = 6;

function arrowsIn(text: string): string[] {
  return text.match(ARROW) ?? [];
}

function isSentence(strings: readonly string[]): boolean {
  return SENTENCE_END.test(strings.join('').trim());
}

function firstMatch(gaps: readonly string[], separators: readonly string[]): string | undefined {
  let found: { marker: string; index: number } | undefined;
  for (const gap of gaps) {
    for (const separator of separators) {
      const index = gap.indexOf(separator);
      if (index >= 0 && (found === undefined || index < found.index)) found = { marker: separator, index };
    }
    if (found !== undefined) return found.marker;
  }
  return undefined;
}

export function findGlueBetweenValues(strings: readonly string[], separators: GlueSeparators = DEFAULT_GROUPS): Glue | undefined {
  const gaps = strings.slice(1, -1);
  const arrows = strings.flatMap(arrowsIn);
  const [firstArrow] = arrows;
  if (firstArrow !== undefined && gaps.some((gap) => arrowsIn(gap).length > 0)) {
    return { kind: arrows.length >= MIN_STEP_ARROWS ? 'steps' : 'comparison', marker: firstArrow };
  }
  const separator =
    firstMatch(gaps, separators.marks) ?? (isSentence(strings) ? undefined : firstMatch(gaps, separators.punctuation));
  return separator === undefined ? undefined : { kind: 'separator', marker: separator };
}

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter((word) => word !== '');
}

function isMenuItem(text: string): boolean {
  const itemWords = words(text);
  return itemWords.length > 0 && itemWords.length <= MAX_MENU_ITEM_WORDS && CAPITALISED.test(itemWords[0] ?? '');
}

export function isMenuPath(text: string): boolean {
  const segments = text.split(ARROW);
  const first = words(segments.at(0) ?? '').at(-1) ?? '';
  const last = words(segments.at(-1) ?? '').at(0) ?? '';
  return segments.length > 2 && CAPITALISED.test(first) && CAPITALISED.test(last) && segments.slice(1, -1).every(isMenuItem);
}

export function findStepsInText(text: string): Glue | undefined {
  const arrows = arrowsIn(text);
  const [firstArrow] = arrows;
  if (firstArrow === undefined || arrows.length < MIN_STEP_ARROWS || isMenuPath(text)) {
    return undefined;
  }
  return { kind: 'steps', marker: firstArrow };
}

function edgeSeparator(text: string | undefined, separators: GlueSeparators): Glue | undefined {
  const edge = (text ?? '').trim();
  const isSeparator = separators.marks.includes(edge) || separators.punctuation.includes(edge);
  return isSeparator ? { kind: 'separator', marker: edge } : undefined;
}

export function findTrailingSeparator(strings: readonly string[], separators: GlueSeparators = DEFAULT_GROUPS): Glue | undefined {
  return strings.length > 1 ? edgeSeparator(strings.at(-1), separators) : undefined;
}

export function findLeadingSeparator(strings: readonly string[], separators: GlueSeparators = DEFAULT_GROUPS): Glue | undefined {
  return strings.length > 1 ? edgeSeparator(strings.at(0), separators) : undefined;
}

export function isSeparatorMark(marker: string, separators: GlueSeparators = DEFAULT_GROUPS): boolean {
  return separators.marks.includes(marker);
}

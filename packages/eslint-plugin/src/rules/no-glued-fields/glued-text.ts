export type GlueKind = 'separator' | 'comparison' | 'steps';

export interface Glue {
  readonly kind: GlueKind;
  readonly marker: string;
}

const ARROW = /→|⇒|⟶|➔|➝|->|=>/g;
const SEPARATOR = /[•·|;,]/;
const SEPARATOR_MARK = /[•·|]/;
const PUNCTUATION = /[;,]/;
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

function firstMatch(gaps: readonly string[], pattern: RegExp): string | undefined {
  for (const gap of gaps) {
    const match = pattern.exec(gap)?.[0];
    if (match !== undefined) {
      return match;
    }
  }
  return undefined;
}

export function findGlueBetweenValues(strings: readonly string[]): Glue | undefined {
  const gaps = strings.slice(1, -1);
  const arrows = strings.flatMap(arrowsIn);
  const [firstArrow] = arrows;
  if (firstArrow !== undefined && gaps.some((gap) => arrowsIn(gap).length > 0)) {
    return { kind: arrows.length >= MIN_STEP_ARROWS ? 'steps' : 'comparison', marker: firstArrow };
  }
  const separator = firstMatch(gaps, SEPARATOR_MARK) ?? (isSentence(strings) ? undefined : firstMatch(gaps, PUNCTUATION));
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

export function findTrailingSeparator(strings: readonly string[]): Glue | undefined {
  const tail = (strings.at(-1) ?? '').trim();
  return strings.length > 1 && tail.length === 1 && SEPARATOR.test(tail) ? { kind: 'separator', marker: tail } : undefined;
}

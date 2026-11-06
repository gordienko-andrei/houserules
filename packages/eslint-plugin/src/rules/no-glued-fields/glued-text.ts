export type GlueKind = 'separator' | 'comparison' | 'steps';

export interface Glue {
  readonly kind: GlueKind;
  readonly marker: string;
}

const ARROW = /→|⇒|⟶|➔|➝|->|=>/g;
const SEPARATOR = /[•·|;,]/;
const MIN_STEP_ARROWS = 2;

function arrowsIn(text: string): string[] {
  return text.match(ARROW) ?? [];
}

export function findGlueBetweenValues(strings: readonly string[]): Glue | undefined {
  const gaps = strings.slice(1, -1);
  const arrows = strings.flatMap(arrowsIn);
  const [firstArrow] = arrows;
  if (firstArrow !== undefined && gaps.some((gap) => arrowsIn(gap).length > 0)) {
    return { kind: arrows.length >= MIN_STEP_ARROWS ? 'steps' : 'comparison', marker: firstArrow };
  }
  for (const gap of gaps) {
    const separator = SEPARATOR.exec(gap)?.[0];
    if (separator !== undefined) {
      return { kind: 'separator', marker: separator };
    }
  }
  return undefined;
}

export function findStepsInText(text: string): Glue | undefined {
  const arrows = arrowsIn(text);
  const [firstArrow] = arrows;
  if (firstArrow === undefined || arrows.length < MIN_STEP_ARROWS) {
    return undefined;
  }
  return { kind: 'steps', marker: firstArrow };
}

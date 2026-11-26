import { parseForESLint } from '@angular-eslint/template-parser';
import { describe, expect, it } from 'vitest';
import { flattenInterpolation, type FlatText } from './flat-text';
import type { InterpolationNode } from './template-ast';

function flatten(template: string): { strings: readonly string[]; values: string[]; listGaps: readonly number[] } {
  const [element] = parseForESLint(template, { filePath: 'x.html' }).ast.templateNodes as unknown as [{ children: [{ value: { ast: InterpolationNode } }] }];
  const flat: FlatText = flattenInterpolation(element.children[0].value.ast);
  return {
    strings: flat.strings,
    values: flat.values.map((value) => template.slice(value.sourceSpan.start, value.sourceSpan.end)),
    listGaps: flat.listGaps,
  };
}

describe('flattenInterpolation', () => {
  it('keeps plain interpolations as they are', () => {
    expect(flatten('<p>{{ a }} · {{ b }}</p>')).toEqual({ strings: ['', ' · ', ''], values: ['a', 'b'], listGaps: [] });
  });

  it('turns string literals of a concatenation and a template literal into text', () => {
    expect(flatten("<p>{{ '£' + (a | number) }}</p>")).toMatchObject({ strings: ['£', ''], values: ['a | number'] });
    expect(flatten('<p>{{ `${a} · ${b}` }}</p>')).toMatchObject({ strings: ['', ' · ', ''], values: ['a', 'b'] });
  });

  it('keeps numeric addition as one value', () => {
    expect(flatten('<p>{{ a + b }}</p>')).toMatchObject({ strings: ['', ''], values: ['a + b'] });
  });

  it('shows the branch with text of a conditional with an empty branch', () => {
    expect(flatten("<p>{{ a }}{{ b ? ' | ' + b : '' }}</p>")).toMatchObject({ strings: ['', ' | ', ''], values: ['a', 'b'] });
    expect(flatten("<p>{{ a }}{{ last ? '' : ' · ' }}</p>")).toMatchObject({ strings: ['', ' · '], values: ['a'] });
  });

  it('treats the words of an optional literal as a value of their own', () => {
    expect(flatten("<p>{{ a }}{{ remote ? ' · remote UK' : '' }}</p>")).toMatchObject({
      strings: ['', ' · ', ''],
      values: ['a', "' · remote UK'"],
    });
  });

  it('shows the value branch of a conditional with a text fallback', () => {
    expect(flatten("<p>{{ s ? '£' + s : 'Not set' }}</p>")).toMatchObject({ strings: ['£', ''], values: ['s'] });
    expect(flatten("<p>{{ ok ? 'Yes' : 'No' }}</p>")).toMatchObject({ strings: ['', ''], values: ["ok ? 'Yes' : 'No'"] });
  });

  it('marks the gap of a join as a list', () => {
    expect(flatten("<p>{{ tags.join(', ') }}</p>")).toEqual({ strings: ['', ', ', ''], values: ['tags', 'tags'], listGaps: [1] });
  });
});

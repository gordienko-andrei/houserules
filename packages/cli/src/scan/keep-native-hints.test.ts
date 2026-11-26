import { describe, expect, it } from 'vitest';
import { findKeepNativeHints } from './keep-native-hints';
import type { ReplacedElement } from './template-facts';

function button(parent: string | undefined, classes: string[] = []): ReplacedElement {
  return { selector: 'button', directives: [], example: { file: 'a.html', line: 1, text: '<button>' }, classes, ...(parent === undefined ? {} : { parent }) };
}

describe('findKeepNativeHints', () => {
  it('suggests excluding repeated meaningful parents and classes', () => {
    const reported = [
      ...Array.from({ length: 4 }, () => button('th')),
      ...Array.from({ length: 5 }, () => button('div', ['jp-pill', 'jp-pill'])),
      button('td'),
      button('div', ['stats-link']),
    ];
    expect(findKeepNativeHints(reported)).toEqual([
      { selector: ':not(.jp-pill)', reason: 'with class jp-pill', count: 5 },
      { selector: ':not(th > *)', reason: 'inside <th>', count: 4 },
    ]);
  });

  it('ignores layout containers and small groups', () => {
    const reported = [...Array.from({ length: 6 }, () => button('div')), button('nav'), button('nav'), button(undefined)];
    expect(findKeepNativeHints(reported)).toEqual([]);
  });
});

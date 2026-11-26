import { describe, expect, it } from 'vitest';
import { parseLibraryTypings } from './library-declarations';

describe('parseLibraryTypings', () => {
  it('reads component selectors and pipe names from Angular library typings', () => {
    const typings = `
      static ɵcmp: i0.ɵɵComponentDeclaration<TuiAmountComponent, "tui-amount, [tuiAmount]", never, { "value": { "alias": "value" } }, {}, never, never, true, never>;
      static ɵcmp: i0.ɵɵComponentDeclaration<TuiBadge, "tui-badge", never, {}, {}, never, ["*"], true, never>;
      static ɵpipe: i0.ɵɵPipeDeclaration<TuiAmountPipe, "tuiAmount", true>;
      static ɵdir: i0.ɵɵDirectiveDeclaration<TuiButton, "a[tuiButton],button[tuiButton]", never, {}, {}, never, never, true, never>;
    `;
    expect(parseLibraryTypings(typings)).toEqual({
      elements: ['tui-amount', 'tui-badge'],
      attributeSelectors: ['[tuiAmount]', 'a[tuiButton]', 'button[tuiButton]'],
      pipes: ['tuiAmount'],
    });
  });

  it('reads elements of directives and of selectors with conditions', () => {
    const typings = `
      static ɵcmp: i0.ɵɵComponentDeclaration<TuiIcon, "tui-icon:not([tuiBadge])", never, {}, {}, never, never, true, never>;
      static ɵdir: i0.ɵɵDirectiveDeclaration<RouterOutlet, "router-outlet", ["outlet"], {}, {}, never, never, true, never>;
    `;
    expect(parseLibraryTypings(typings).elements).toEqual(['tui-icon', 'router-outlet']);
  });

  it('unescapes quotes inside a selector', () => {
    const typings = 'static ɵcmp: i0.ɵɵComponentDeclaration<TuiCheckbox, "input[type=\\"checkbox\\"][tuiCheckbox]", never, {}, {}, never, never, true, never>;';
    expect(parseLibraryTypings(typings).attributeSelectors).toEqual(['input[type="checkbox"][tuiCheckbox]']);
  });
});

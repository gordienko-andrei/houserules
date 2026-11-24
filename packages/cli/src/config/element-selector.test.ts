import { describe, expect, it } from 'vitest';
import {
  elementFactsOf,
  isCustomElementSelector,
  matchesElementSelector,
  parseElementSelector,
  selectorCovers,
  splitSelectorList,
  type ElementSelector,
} from './element-selector';

function selector(source: string): ElementSelector {
  const parsed = parseElementSelector(source);
  if (parsed === undefined) throw new Error(`invalid selector ${source}`);
  return parsed;
}

function element(name: string, attributes: Record<string, string | undefined> = {}) {
  return { name, attributes: new Map(Object.entries(attributes)) };
}

describe('parseElementSelector', () => {
  it('parses a tag with required and excluded attributes', () => {
    expect(parseElementSelector('input[type=checkbox]:not([formControlName])')).toEqual({
      source: 'input[type=checkbox]:not([formControlName])',
      tag: 'input',
      required: [{ name: 'type', value: 'checkbox' }],
      excluded: [{ name: 'formControlName' }],
    });
    expect(parseElementSelector('button[type="submit"]')?.required).toEqual([{ name: 'type', value: 'submit' }]);
  });

  it('parses an attribute selector without a tag', () => {
    expect(parseElementSelector('[pButton]')).toEqual({ source: '[pButton]', required: [{ name: 'pButton' }], excluded: [] });
  });

  it('rejects selectors outside the supported subset', () => {
    for (const source of ['', '.button', ':not([a])', 'div > button', 'button,a', 'button:hover', 'button:not([a]', 'button[']) {
      expect(parseElementSelector(source), source).toBeUndefined();
    }
  });
});

describe('splitSelectorList', () => {
  it('splits an Angular selector list at top-level commas', () => {
    expect(splitSelectorList('button[mat-button], a[mat-button],[x=","]')).toEqual(['button[mat-button]', 'a[mat-button]', '[x=","]']);
  });
});

describe('selectorCovers', () => {
  it('applies a directive declaration to a role selector that requires the same attribute', () => {
    expect(selectorCovers(selector('[pButton]'), selector('button[pButton]'))).toBe(true);
    expect(selectorCovers(selector('button[mat-button]'), selector('button[mat-button]'))).toBe(true);
    expect(selectorCovers(selector('a[mat-button]'), selector('button[mat-button]'))).toBe(false);
    expect(selectorCovers(selector('[pButton]'), selector('button'))).toBe(false);
  });
});

describe('isCustomElementSelector', () => {
  it('tells a plain custom element from other selectors', () => {
    expect(isCustomElementSelector(selector('ui-money'))).toBe(true);
    expect(isCustomElementSelector(selector('button[pButton]'))).toBe(false);
    expect(isCustomElementSelector(selector('button'))).toBe(false);
  });
});

describe('elementFactsOf', () => {
  it('collects static attributes and property bindings, but not class or style bindings', () => {
    const facts = elementFactsOf({
      name: 'button',
      attributes: [{ name: 'pButton', value: '' }],
      inputs: [
        { name: 'type', __originalType: 0 },
        { name: 'on', __originalType: 2 },
      ],
    });
    expect(facts.name).toBe('button');
    expect([...facts.attributes]).toEqual([
      ['pButton', ''],
      ['type', undefined],
    ]);
  });
});

describe('matchesElementSelector', () => {
  it('matches the tag regardless of case', () => {
    expect(matchesElementSelector(selector('button'), element('BUTTON'))).toBe(true);
    expect(matchesElementSelector(selector('button'), element('p-button'))).toBe(false);
  });

  it('skips elements that carry an excluded attribute directive', () => {
    const plainButton = selector('button:not([pButton])');
    expect(matchesElementSelector(plainButton, element('button', { type: 'button' }))).toBe(true);
    expect(matchesElementSelector(plainButton, element('button', { pButton: '' }))).toBe(false);
  });

  it('matches attribute values only when they are static', () => {
    const checkbox = selector('input[type=checkbox]');
    expect(matchesElementSelector(checkbox, element('input', { type: 'checkbox' }))).toBe(true);
    expect(matchesElementSelector(checkbox, element('input', { type: 'text' }))).toBe(false);
    expect(matchesElementSelector(checkbox, element('input', { type: undefined }))).toBe(false);
  });

  it('treats a bound value as possibly excluded', () => {
    const notSubmit = selector('button:not([type=submit])');
    expect(matchesElementSelector(notSubmit, element('button', { type: 'button' }))).toBe(true);
    expect(matchesElementSelector(notSubmit, element('button', { type: undefined }))).toBe(false);
  });
});

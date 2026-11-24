import { describe, expect, it } from 'vitest';
import { parseElementSelector } from './element-selector';
import { directiveAttributesOf, isPlainNativeMatch, isStandardAttribute } from './html-attributes';

function element(attributes: Record<string, string | undefined>) {
  return { name: 'button', attributes: new Map(Object.entries(attributes)) };
}

describe('isStandardAttribute', () => {
  it('accepts HTML attributes, property names, prefixes and Angular built-in directives', () => {
    for (const name of ['type', 'class', 'disabled', 'aria-label', 'data-testid', 'i18n-title', 'innerHTML', 'tabIndex', 'formControlName', 'routerLink']) {
      expect(isStandardAttribute(name), name).toBe(true);
    }
  });

  it('rejects design system directives', () => {
    for (const name of ['pButton', 'matButton', 'mat-tab-link', 'tuiButton', 'appTooltip']) {
      expect(isStandardAttribute(name), name).toBe(false);
    }
  });
});

describe('directiveAttributesOf', () => {
  it('lists attributes that look like directives', () => {
    expect(directiveAttributesOf(element({ type: 'button', matChipRemove: '', class: 'x' }))).toEqual(['matChipRemove']);
    expect(directiveAttributesOf(element({ type: 'checkbox', formControlName: 'onlyErrors' }))).toEqual([]);
  });

  it('ignores attributes the selector itself names', () => {
    const selector = parseElementSelector('button[appAction]');
    expect(directiveAttributesOf(element({ appAction: '' }), selector)).toEqual([]);
  });
});

describe('isPlainNativeMatch', () => {
  it('matches the selector only on elements without a directive', () => {
    const button = parseElementSelector('button');
    if (button === undefined) throw new Error('invalid selector');
    expect(isPlainNativeMatch(button, element({ type: 'button', class: 'retry' }))).toBe(true);
    expect(isPlainNativeMatch(button, element({ type: 'button', matChipRemove: '' }))).toBe(false);
  });
});

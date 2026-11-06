import { describe, expect, it } from 'vitest';
import { hasPxFontSizeInCss, hasPxFontSizeInStyleMap, hasPxInExpression } from './px-font-size';

describe('hasPxFontSizeInCss', () => {
  it('finds px in font-size and in the font shorthand', () => {
    expect(hasPxFontSizeInCss('color: red; font-size: 14px')).toBe(true);
    expect(hasPxFontSizeInCss('FONT-SIZE:13.5PX')).toBe(true);
    expect(hasPxFontSizeInCss('font: bold 12px/1.5 Arial')).toBe(true);
    expect(hasPxFontSizeInCss("'font-size: 12px'")).toBe(true);
  });

  it('allows relative units and px in other properties', () => {
    expect(hasPxFontSizeInCss('font-size: 1.25rem; padding: 8px')).toBe(false);
    expect(hasPxFontSizeInCss('line-height: 20px')).toBe(false);
    expect(hasPxFontSizeInCss('font-family: px-grotesk')).toBe(false);
    expect(hasPxFontSizeInCss('')).toBe(false);
  });
});

describe('hasPxInExpression', () => {
  it('finds px literals and px suffixes', () => {
    expect(hasPxInExpression("'12px'")).toBe(true);
    expect(hasPxInExpression("size + 'px'")).toBe(true);
    expect(hasPxInExpression('`${size}px`')).toBe(true);
  });

  it('ignores names that only contain px', () => {
    expect(hasPxInExpression('sizePx')).toBe(false);
    expect(hasPxInExpression("'1.2rem'")).toBe(false);
  });
});

describe('hasPxFontSizeInStyleMap', () => {
  it('finds px font sizes in ngStyle and [style] maps', () => {
    expect(hasPxFontSizeInStyleMap("{'font-size': '12px'}")).toBe(true);
    expect(hasPxFontSizeInStyleMap("{ fontSize: size + 'px', color: c }")).toBe(true);
    expect(hasPxFontSizeInStyleMap("{'font-size.px': 12}")).toBe(true);
  });

  it('allows other units and other properties', () => {
    expect(hasPxFontSizeInStyleMap("{'font-size.rem': 1.2, 'width': '10px'}")).toBe(false);
    expect(hasPxFontSizeInStyleMap("{ 'margin': '4px' }")).toBe(false);
  });
});

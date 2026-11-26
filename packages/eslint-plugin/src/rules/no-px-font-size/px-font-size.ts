const FONT_PROPERTIES = new Set(['font-size', 'font']);
const PX_LENGTH = /\d(?:\.\d+)?px\b/i;
const PX_IN_EXPRESSION = /\d(?:\.\d+)?px\b|['"`}]px\b/i;
const STYLE_MAP_FONT_ENTRY = /['"]?(?:font-size|fontSize|font)(\.px)?['"]?\s*:\s*([^,}]*)/g;

// Tailwind arbitrary values: `text-[12px]`, `md:!text-[12px]/[16px]`, `text-[length:12px]`, `[font-size:12px]`.
const PX_FONT_CLASS = /(?:^|[\s:'"`!])(?:text-\[(?:length:)?\d+(?:\.\d+)?px\]|\[font-size:\d+(?:\.\d+)?px\])/i;

export const FONT_STYLE_BINDINGS = new Set(['font-size', 'fontSize', 'font']);

export function hasPxFontSizeClass(text: string): boolean {
  return PX_FONT_CLASS.test(text);
}

export function hasPxFontSizeInCss(css: string): boolean {
  return css.split(';').some((declaration) => {
    const separatorIndex = declaration.indexOf(':');
    if (separatorIndex === -1) {
      return false;
    }
    const property = declaration.slice(0, separatorIndex).trim().replace(/^['"`]/, '').toLowerCase();
    return FONT_PROPERTIES.has(property) && PX_LENGTH.test(declaration.slice(separatorIndex + 1));
  });
}

export function hasPxInExpression(expression: string): boolean {
  return PX_IN_EXPRESSION.test(expression);
}

export function hasPxFontSizeInStyleMap(expression: string): boolean {
  for (const [, pxUnitKey, value] of expression.matchAll(STYLE_MAP_FONT_ENTRY)) {
    if (pxUnitKey !== undefined || hasPxInExpression(value ?? '')) {
      return true;
    }
  }
  return false;
}

const FONT_PROPERTIES = new Set(['font-size', 'font']);
const PX_LENGTH = /\d(?:\.\d+)?px\b/i;
const PX_IN_EXPRESSION = /\d(?:\.\d+)?px\b|['"`}]px\b/i;
const STYLE_MAP_FONT_ENTRY = /['"]?(?:font-size|fontSize|font)(\.px)?['"]?\s*:\s*([^,}]*)/g;

export const FONT_STYLE_BINDINGS = new Set(['font-size', 'fontSize', 'font']);

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

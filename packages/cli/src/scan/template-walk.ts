export interface WalkedNode {
  readonly type: string;
  readonly [key: string]: unknown;
}

const SKIPPED_KEYS = new Set([
  'parent',
  'loc',
  'range',
  'sourceSpan',
  'startSourceSpan',
  'endSourceSpan',
  'keySpan',
  'valueSpan',
  'nameSpan',
  'i18n',
  'tokens',
  'comments',
]);

function isWalkedNode(value: unknown): value is WalkedNode {
  return typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string';
}

export function walkTemplate(value: unknown, visit: (node: WalkedNode) => void): void {
  if (Array.isArray(value)) {
    value.forEach((item) => walkTemplate(item, visit));
    return;
  }
  if (!isWalkedNode(value)) {
    return;
  }
  visit(value);
  for (const [key, child] of Object.entries(value)) {
    if (!SKIPPED_KEYS.has(key) && typeof child === 'object' && child !== null) {
      walkTemplate(child, visit);
    }
  }
}

export function lineAt(text: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset && index < text.length; index++) {
    if (text[index] === '\n') {
      line++;
    }
  }
  return line;
}

export function lineTextAt(text: string, offset: number): string {
  const start = text.lastIndexOf('\n', offset - 1) + 1;
  const end = text.indexOf('\n', offset);
  return text.slice(start, end === -1 ? text.length : end).trim();
}

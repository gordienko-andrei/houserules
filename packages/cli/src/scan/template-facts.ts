import { parseForESLint } from '@angular-eslint/template-parser';
import { findExpressionsNextToCurrency } from '../text/currency-text';
import { lineAt, lineTextAt, walkTemplate, type WalkedNode } from './template-walk';

export interface TemplateSource {
  readonly file: string;
  readonly text: string;
  readonly firstLine: number;
}

export interface UsageExample {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

export interface ElementUsage {
  readonly selector: string;
  readonly attributeNames: readonly string[];
  readonly example: UsageExample;
}

export interface PipeUsage {
  readonly name: string;
  readonly example: UsageExample;
}

export interface TemplateFacts {
  readonly elements: readonly ElementUsage[];
  readonly pipes: readonly PipeUsage[];
  readonly handFormattedMoney: readonly UsageExample[];
  readonly parseError?: string;
}

interface Offsets {
  readonly start: number;
  readonly end: number;
}

const MAX_EXAMPLE_LENGTH = 200;

function spanOf(node: WalkedNode, key: 'sourceSpan' | 'startSourceSpan'): Offsets | undefined {
  const span = node[key] as { start?: unknown; end?: unknown } | undefined;
  const start = typeof span?.start === 'number' ? span.start : (span?.start as { offset?: number } | undefined)?.offset;
  const end = typeof span?.end === 'number' ? span.end : (span?.end as { offset?: number } | undefined)?.offset;
  return start === undefined || end === undefined ? undefined : { start, end };
}

function namesOf(node: WalkedNode, key: 'attributes' | 'inputs' | 'outputs'): string[] {
  const items = node[key];
  return Array.isArray(items) ? items.map((item: { name?: unknown }) => String(item.name)) : [];
}

function exampleAt(source: TemplateSource, offsets: Offsets, text?: string): UsageExample {
  const shown = (text ?? lineTextAt(source.text, offsets.start)).replace(/\s+/g, ' ').slice(0, MAX_EXAMPLE_LENGTH);
  return { file: source.file, line: source.firstLine + lineAt(source.text, offsets.start) - 1, text: shown };
}

function elementUsage(source: TemplateSource, node: WalkedNode): ElementUsage | undefined {
  const name = String(node['name']);
  const offsets = spanOf(node, 'startSourceSpan');
  if (!name.includes('-') || offsets === undefined) {
    return undefined;
  }
  const attributeNames = [...namesOf(node, 'attributes'), ...namesOf(node, 'inputs'), ...namesOf(node, 'outputs')];
  return {
    selector: name,
    attributeNames: [...new Set(attributeNames)].sort(),
    example: exampleAt(source, offsets, source.text.slice(offsets.start, offsets.end)),
  };
}

export function collectTemplateFacts(source: TemplateSource, currencyWords: readonly string[]): TemplateFacts {
  const elements: ElementUsage[] = [];
  const pipes: PipeUsage[] = [];
  const handFormattedMoney: UsageExample[] = [];
  let templateNodes: unknown;
  try {
    templateNodes = parseForESLint(source.text, { filePath: source.file }).ast.templateNodes;
  } catch (error) {
    return { elements, pipes, handFormattedMoney, parseError: error instanceof Error ? error.message : String(error) };
  }
  walkTemplate(templateNodes, (node) => {
    const offsets = spanOf(node, 'sourceSpan');
    if (node.type === 'Element') {
      const usage = elementUsage(source, node);
      if (usage !== undefined) {
        elements.push(usage);
      }
    } else if (node.type === 'BindingPipe' && offsets !== undefined) {
      pipes.push({ name: String(node['name']), example: exampleAt(source, offsets) });
    } else if (node.type === 'Interpolation' && offsets !== undefined) {
      const strings = node['strings'] as readonly string[];
      if (findExpressionsNextToCurrency(strings, currencyWords).length > 0) {
        handFormattedMoney.push(exampleAt(source, offsets));
      }
    }
  });
  return { elements, pipes, handFormattedMoney };
}

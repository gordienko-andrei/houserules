import { parseForESLint } from '@angular-eslint/template-parser';
import { elementFactsOf, matchesElementSelector, type ElementSelector } from '../config/element-selector';
import { directiveAttributesOf } from '../config/html-attributes';
import { findAmountsNextToCurrencyCode, findExpressionsNextToCurrency } from '../text/currency-text';
import { lineTextAt, walkTemplate, type WalkedNode } from './template-walk';

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

export interface ReplacedElement {
  readonly selector: string;
  readonly directives: readonly string[];
  readonly example: UsageExample;
}

export interface TemplateTargets {
  readonly elements?: readonly ElementSelector[];
  readonly replaced?: readonly ElementSelector[];
}

export interface TemplateFacts {
  readonly elements: readonly ElementUsage[];
  readonly targetElements: readonly ElementUsage[];
  readonly replacedElements: readonly ReplacedElement[];
  readonly pipes: readonly PipeUsage[];
  readonly handFormattedMoney: readonly UsageExample[];
  readonly parseError?: string;
}

interface Offsets {
  readonly start: number;
  readonly end: number;
}

const MAX_EXAMPLE_LENGTH = 200;
const lineStarts = new WeakMap<TemplateSource, number[]>();

function lineNumberAt(source: TemplateSource, offset: number): number {
  let starts = lineStarts.get(source);
  if (starts === undefined) {
    starts = [0];
    for (let i = 0; i < source.text.length; i++) {
      if (source.text[i] === '\n') starts.push(i + 1);
    }
    lineStarts.set(source, starts);
  }
  let low = 0;
  let high = starts.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if ((starts[middle] ?? 0) <= offset) low = middle;
    else high = middle;
  }
  return source.firstLine + low;
}
const ANGULAR_BUILT_IN_ELEMENTS = new Set(['ng-container', 'ng-template', 'ng-content']);

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
  return { file: source.file, line: lineNumberAt(source, offsets.start), text: shown };
}

function usageAs(selector: string, source: TemplateSource, node: WalkedNode, offsets: Offsets): ElementUsage {
  const attributeNames = [...namesOf(node, 'attributes'), ...namesOf(node, 'inputs'), ...namesOf(node, 'outputs')];
  return {
    selector,
    attributeNames: [...new Set(attributeNames)].sort(),
    example: exampleAt(source, offsets, source.text.slice(offsets.start, offsets.end)),
  };
}

function elementUsage(source: TemplateSource, node: WalkedNode): ElementUsage | undefined {
  const name = String(node['name']);
  const offsets = spanOf(node, 'startSourceSpan');
  if (!name.includes('-') || ANGULAR_BUILT_IN_ELEMENTS.has(name) || offsets === undefined) {
    return undefined;
  }
  return usageAs(name, source, node, offsets);
}

function targetUsages(source: TemplateSource, node: WalkedNode, targets: readonly ElementSelector[]): ElementUsage[] {
  const offsets = spanOf(node, 'startSourceSpan');
  if (targets.length === 0 || offsets === undefined) return [];
  const facts = elementFactsOf(node);
  return targets.filter((target) => matchesElementSelector(target, facts)).map((target) => usageAs(target.source, source, node, offsets));
}

function replacedElements(source: TemplateSource, node: WalkedNode, selectors: readonly ElementSelector[]): ReplacedElement[] {
  const offsets = spanOf(node, 'startSourceSpan');
  if (selectors.length === 0 || offsets === undefined) return [];
  const facts = elementFactsOf(node);
  return selectors
    .filter((selector) => matchesElementSelector(selector, facts))
    .map((selector) => ({ selector: selector.source, directives: directiveAttributesOf(facts, selector), example: exampleAt(source, offsets) }));
}

function expressionSpans(node: WalkedNode): (Offsets | undefined)[] {
  const expressions = node['expressions'];
  return Array.isArray(expressions) ? expressions.map((expression: WalkedNode) => spanOf(expression, 'sourceSpan')) : [];
}

function handFormattedMoneyAt(source: TemplateSource, node: WalkedNode, currencyWords: readonly string[]): Offsets | undefined {
  const strings = node['strings'] as readonly string[];
  const spans = expressionSpans(node);
  const texts = spans.map((span) => (span === undefined ? '' : source.text.slice(span.start, span.end)));
  const indexes = [...findExpressionsNextToCurrency(strings, currencyWords), ...findAmountsNextToCurrencyCode(strings, texts)];
  if (indexes.length === 0) {
    return undefined;
  }
  return spans[Math.min(...indexes)] ?? spanOf(node, 'sourceSpan');
}

export function collectTemplateFacts(source: TemplateSource, currencyWords: readonly string[], targets: TemplateTargets = {}): TemplateFacts {
  const elements: ElementUsage[] = [];
  const targetElements: ElementUsage[] = [];
  const replaced: ReplacedElement[] = [];
  const pipes: PipeUsage[] = [];
  const handFormattedMoney: UsageExample[] = [];
  let templateNodes: unknown;
  try {
    templateNodes = parseForESLint(source.text, { filePath: source.file }).ast.templateNodes;
  } catch (error) {
    const parseError = error instanceof Error ? error.message : String(error);
    return { elements, targetElements, replacedElements: replaced, pipes, handFormattedMoney, parseError };
  }
  walkTemplate(templateNodes, (node) => {
    const offsets = spanOf(node, 'sourceSpan');
    if (node.type === 'Element') {
      const usage = elementUsage(source, node);
      if (usage !== undefined) {
        elements.push(usage);
      }
      targetElements.push(...targetUsages(source, node, targets.elements ?? []));
      replaced.push(...replacedElements(source, node, targets.replaced ?? []));
    } else if (node.type === 'BindingPipe' && offsets !== undefined) {
      pipes.push({ name: String(node['name']), example: exampleAt(source, offsets) });
    } else if (node.type === 'Interpolation') {
      const moneyOffsets = handFormattedMoneyAt(source, node, currencyWords);
      if (moneyOffsets !== undefined) {
        handFormattedMoney.push(exampleAt(source, moneyOffsets));
      }
    }
  });
  return { elements, targetElements, replacedElements: replaced, pipes, handFormattedMoney };
}

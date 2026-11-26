import { parseForESLint } from '@angular-eslint/template-parser';
import { elementFactsOf, matchesElementSelector, type ElementSelector } from '../config/element-selector';
import { directiveAttributesOf } from '../config/html-attributes';
import { findAmountsNextToCurrencyCode, findExpressionsNextToCurrency, isCurrencyNamed } from '../text/currency-text';
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
  readonly parent?: string;
  readonly classes: readonly string[];
}

export interface TemplateTargets {
  readonly elements?: readonly ElementSelector[];
  readonly replaced?: readonly ElementSelector[];
  readonly nonComponentAttributes?: readonly string[];
}

export interface AttributeUsage {
  readonly name: string;
  readonly element: string;
  readonly example: UsageExample;
}

export interface TemplateFacts {
  readonly elements: readonly ElementUsage[];
  readonly attributes: readonly AttributeUsage[];
  readonly targetElements: readonly ElementUsage[];
  readonly replacedElements: readonly ReplacedElement[];
  readonly pipes: readonly PipeUsage[];
  readonly handFormattedMoney: readonly UsageExample[];
  readonly currencyNamedValues: readonly UsageExample[];
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

function startTagExample(source: TemplateSource, offsets: Offsets): UsageExample {
  return exampleAt(source, offsets, source.text.slice(offsets.start, offsets.end));
}

function usageAs(selector: string, source: TemplateSource, node: WalkedNode, offsets: Offsets): ElementUsage {
  const attributeNames = [...namesOf(node, 'attributes'), ...namesOf(node, 'inputs'), ...namesOf(node, 'outputs')];
  return {
    selector,
    attributeNames: [...new Set(attributeNames)].sort(),
    example: startTagExample(source, offsets),
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

function targetUsages(
  source: TemplateSource,
  node: WalkedNode,
  ancestors: readonly WalkedNode[],
  targets: readonly ElementSelector[],
): ElementUsage[] {
  const offsets = spanOf(node, 'startSourceSpan');
  if (targets.length === 0 || offsets === undefined) return [];
  const facts = elementFactsOf(node, ancestors);
  return targets.filter((target) => matchesElementSelector(target, facts)).map((target) => usageAs(target.source, source, node, offsets));
}

function attributeUsages(source: TemplateSource, node: WalkedNode): AttributeUsage[] {
  const offsets = spanOf(node, 'startSourceSpan');
  if (offsets === undefined) return [];
  const element = String(node['name']);
  return directiveAttributesOf(elementFactsOf(node)).map((name) => ({ name, element, example: startTagExample(source, offsets) }));
}

function replacedElements(
  source: TemplateSource,
  node: WalkedNode,
  ancestors: readonly WalkedNode[],
  targets: TemplateTargets,
): ReplacedElement[] {
  const offsets = spanOf(node, 'startSourceSpan');
  const selectors = targets.replaced ?? [];
  if (selectors.length === 0 || offsets === undefined) return [];
  const facts = elementFactsOf(node, ancestors);
  const classes = (facts.attributes.get('class') ?? '').split(/\s+/).filter((name) => name !== '');
  const parent = ancestors[0] === undefined ? {} : { parent: String(ancestors[0]['name']) };
  return selectors
    .filter((selector) => matchesElementSelector(selector, facts))
    .map((selector) => ({
      selector: selector.source,
      directives: directiveAttributesOf(facts, selector, targets.nonComponentAttributes),
      example: startTagExample(source, offsets),
      classes,
      ...parent,
    }));
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

function currencyNamedAt(source: TemplateSource, node: WalkedNode, currencyWords: readonly string[]): Offsets | undefined {
  return expressionSpans(node).find((span) => span !== undefined && isCurrencyNamed(source.text.slice(span.start, span.end), currencyWords));
}

export function collectTemplateFacts(source: TemplateSource, currencyWords: readonly string[], targets: TemplateTargets = {}): TemplateFacts {
  const elements: ElementUsage[] = [];
  const attributes: AttributeUsage[] = [];
  const targetElements: ElementUsage[] = [];
  const replaced: ReplacedElement[] = [];
  const pipes: PipeUsage[] = [];
  const handFormattedMoney: UsageExample[] = [];
  const currencyNamedValues: UsageExample[] = [];
  let templateNodes: unknown;
  try {
    templateNodes = parseForESLint(source.text, { filePath: source.file }).ast.templateNodes;
  } catch (error) {
    const parseError = error instanceof Error ? error.message : String(error);
    return { elements, attributes, targetElements, replacedElements: replaced, pipes, handFormattedMoney, currencyNamedValues, parseError };
  }
  walkTemplate(templateNodes, (node, ancestors) => {
    const offsets = spanOf(node, 'sourceSpan');
    if (node.type === 'Element') {
      const usage = elementUsage(source, node);
      if (usage !== undefined) {
        elements.push(usage);
      }
      attributes.push(...attributeUsages(source, node));
      targetElements.push(...targetUsages(source, node, ancestors, targets.elements ?? []));
      replaced.push(...replacedElements(source, node, ancestors, targets));
    } else if (node.type === 'BindingPipe' && offsets !== undefined) {
      pipes.push({ name: String(node['name']), example: exampleAt(source, offsets) });
    } else if (node.type === 'Interpolation') {
      const moneyOffsets = handFormattedMoneyAt(source, node, currencyWords);
      const namedOffsets = moneyOffsets === undefined ? currencyNamedAt(source, node, currencyWords) : undefined;
      if (moneyOffsets !== undefined) {
        handFormattedMoney.push(exampleAt(source, moneyOffsets));
      } else if (namedOffsets !== undefined) {
        currencyNamedValues.push(exampleAt(source, namedOffsets));
      }
    }
  });
  return { elements, attributes, targetElements, replacedElements: replaced, pipes, handFormattedMoney, currencyNamedValues };
}

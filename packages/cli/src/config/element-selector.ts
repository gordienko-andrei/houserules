export interface AttributeCondition {
  readonly name: string;
  readonly value?: string;
  readonly isWord?: boolean;
}

export interface ContextCondition {
  readonly ancestor: ElementSelector;
  readonly isDirectParent: boolean;
}

export interface ElementSelector {
  readonly source: string;
  readonly tag?: string;
  readonly required: readonly AttributeCondition[];
  readonly excluded: readonly AttributeCondition[];
  readonly excludedContexts: readonly ContextCondition[];
}

export interface ElementFacts {
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string | undefined>;
  readonly ancestors?: readonly ElementFacts[];
}

const TAG = /^[a-zA-Z][\w-]*/;
const ATTRIBUTE = /^\[\s*([a-zA-Z_:@.][\w:.-]*)\s*(?:(~?)=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\s*)?\]/;
const CLASS_NAME = /^\.(-?[_a-zA-Z][\w-]*)/;
const CONTEXT_TAIL = /^\s*(>?)\s*\*\s*\)/;
const NOT_PREFIX = ':not(';
const BINDING_TYPE_PROPERTY = 0;
const BINDING_TYPE_ATTRIBUTE = 1;
const BINDING_TYPE_TWO_WAY = 5;
const ATTRIBUTE_BINDINGS = new Set([BINDING_TYPE_PROPERTY, BINDING_TYPE_ATTRIBUTE, BINDING_TYPE_TWO_WAY]);
// HTML compares the values of these attributes without case: `type="CHECKBOX"` is a checkbox.
const CASE_INSENSITIVE_VALUES = new Set(['type', 'method', 'dir', 'inputmode', 'enterkeyhint', 'loading', 'decoding']);

interface Parsed<T> {
  readonly result: T;
  readonly rest: string;
}

interface Compound {
  readonly tag?: string;
  readonly required: AttributeCondition[];
  readonly excluded: AttributeCondition[];
  readonly excludedContexts: ContextCondition[];
}

function readCondition(text: string): Parsed<AttributeCondition> | undefined {
  const className = CLASS_NAME.exec(text);
  if (className !== null) {
    return { result: { name: 'class', value: className[1] ?? '', isWord: true }, rest: text.slice(className[0].length) };
  }
  const match = ATTRIBUTE.exec(text);
  if (match === null) return undefined;
  const name = match[1] ?? '';
  const value = match[3] ?? match[4] ?? match[5];
  const condition: AttributeCondition =
    value === undefined ? { name } : match[2] === '~' ? { name, value, isWord: true } : { name, value };
  return { result: condition, rest: text.slice(match[0].length) };
}

function toSelector(source: string, compound: Compound): ElementSelector {
  const conditions = { required: compound.required, excluded: compound.excluded, excludedContexts: compound.excludedContexts };
  return compound.tag === undefined ? { source, ...conditions } : { source, tag: compound.tag, ...conditions };
}

function readContext(text: string): Parsed<ContextCondition> | undefined {
  const ancestor = readCompound(text, false);
  if (ancestor === undefined) return undefined;
  const tail = CONTEXT_TAIL.exec(ancestor.rest);
  if (tail === null) return undefined;
  const source = text.slice(0, text.length - ancestor.rest.length).trim();
  return {
    result: { ancestor: toSelector(source, ancestor.result), isDirectParent: tail[1] === '>' },
    rest: ancestor.rest.slice(tail[0].length),
  };
}

function readNegation(text: string, compound: Compound, allowsContext: boolean): string | undefined {
  const condition = readCondition(text);
  if (condition !== undefined && condition.rest.startsWith(')')) {
    compound.excluded.push(condition.result);
    return condition.rest.slice(1);
  }
  const context = allowsContext ? readContext(text) : undefined;
  if (context === undefined) return undefined;
  compound.excludedContexts.push(context.result);
  return context.rest;
}

function readCompound(text: string, allowsContext: boolean): Parsed<Compound> | undefined {
  const tag = TAG.exec(text)?.[0];
  const compound: Compound = { tag: tag?.toLowerCase(), required: [], excluded: [], excludedContexts: [] };
  let rest = text.slice(tag?.length ?? 0);
  for (;;) {
    if (rest.startsWith(NOT_PREFIX)) {
      const afterNegation = readNegation(rest.slice(NOT_PREFIX.length), compound, allowsContext);
      if (afterNegation === undefined) return undefined;
      rest = afterNegation;
      continue;
    }
    const condition = readCondition(rest);
    if (condition === undefined) break;
    compound.required.push(condition.result);
    rest = condition.rest;
  }
  if (tag === undefined && compound.required.length === 0) return undefined;
  return { result: compound, rest };
}

export function parseElementSelector(source: string): ElementSelector | undefined {
  const text = source.trim();
  const compound = readCompound(text, true);
  if (compound === undefined || compound.rest !== '') return undefined;
  return toSelector(text, compound.result);
}

export function splitSelectorList(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '(' || character === '[') depth++;
    else if (character === ')' || character === ']') depth--;
    else if (character === ',' && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter((part) => part !== '');
}

const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function renderAttributes(conditions: readonly AttributeCondition[]): string {
  const values = new Map<string, string[]>();
  for (const condition of conditions) {
    const list = values.get(condition.name) ?? [];
    if (condition.value !== undefined) list.push(condition.value);
    values.set(condition.name, list);
  }
  return [...values].map(([name, list]) => (list.length === 0 ? ` ${name}` : ` ${name}="${list.join(' ')}"`)).join('');
}

export function renderSampleElement(selector: ElementSelector): string {
  const tag = selector.tag ?? 'div';
  const attributes = renderAttributes(selector.required);
  return VOID_ELEMENTS.has(tag) ? `<${tag}${attributes} />` : `<${tag}${attributes}></${tag}>`;
}

export function isCustomElementSelector(selector: ElementSelector): boolean {
  return (
    selector.tag !== undefined &&
    selector.tag.includes('-') &&
    selector.required.length === 0 &&
    selector.excluded.length === 0 &&
    selector.excludedContexts.length === 0
  );
}

export function describeElementSelector(source: string): string {
  const selector = parseElementSelector(source);
  return selector !== undefined && isCustomElementSelector(selector) ? `<${selector.source}>` : `\`${source}\``;
}

function valueMatches(condition: AttributeCondition, value: string): boolean {
  const expected = condition.value ?? '';
  if (condition.isWord === true) return value.split(/\s+/).includes(expected);
  return CASE_INSENSITIVE_VALUES.has(condition.name.toLowerCase()) ? value.toLowerCase() === expected.toLowerCase() : value === expected;
}

// A bound attribute has no static value: it may hold any value, so the element is matched only when that cannot be wrong.
function mayHave(element: ElementFacts, condition: AttributeCondition): boolean {
  if (!element.attributes.has(condition.name)) return false;
  const value = element.attributes.get(condition.name);
  return condition.value === undefined || value === undefined || valueMatches(condition, value);
}

function surelyHas(element: ElementFacts, condition: AttributeCondition): boolean {
  if (!element.attributes.has(condition.name)) return false;
  const value = element.attributes.get(condition.name);
  return condition.value === undefined || (value !== undefined && valueMatches(condition, value));
}

function matchesCompound(selector: ElementSelector, element: ElementFacts): boolean {
  return (
    (selector.tag === undefined || element.name.toLowerCase() === selector.tag) &&
    selector.required.every((condition) => surelyHas(element, condition)) &&
    !selector.excluded.some((condition) => mayHave(element, condition))
  );
}

// Without known ancestors the element may stand in the excluded context, so it is not matched.
function mayBeInContext(element: ElementFacts, context: ContextCondition): boolean {
  if (element.ancestors === undefined) return true;
  const candidates = context.isDirectParent ? element.ancestors.slice(0, 1) : element.ancestors;
  return candidates.some((ancestor) => matchesCompound(context.ancestor, ancestor));
}

export function matchesElementSelector(selector: ElementSelector, element: ElementFacts): boolean {
  return matchesCompound(selector, element) && !selector.excludedContexts.some((context) => mayBeInContext(element, context));
}

// True when the declared selector applies to every element the target selects. A declaration may also pin a native
// attribute to a value the target leaves open, as `input[type=checkbox][tuiCheckbox]` does for `input[tuiCheckbox]`.
// A bare `[loading]` is a different directive on top (`[tuiButton][loading]`), not the same declaration.
export function selectorCovers(
  declared: ElementSelector,
  target: ElementSelector,
  isNativeAttribute: (name: string) => boolean = () => false,
): boolean {
  if (declared.tag !== undefined && declared.tag !== target.tag) return false;
  let matchesDirective = false;
  for (const condition of declared.required) {
    const candidates = target.required.filter((candidate) => candidate.name.toLowerCase() === condition.name.toLowerCase());
    const isMatched = candidates.some((candidate) => condition.value === undefined || candidate.value === condition.value);
    if (isMatched) {
      matchesDirective ||= !isNativeAttribute(condition.name);
      continue;
    }
    const isPinnedNativeValue = condition.value !== undefined && isNativeAttribute(condition.name);
    if (candidates.length > 0 || !isPinnedNativeValue) return false;
  }
  return matchesDirective || declared.required.length === 0;
}

interface ParsedAttribute {
  readonly name?: unknown;
  readonly value?: unknown;
  readonly __originalType?: unknown;
}

function listOf(value: unknown): ParsedAttribute[] {
  return Array.isArray(value) ? (value as ParsedAttribute[]) : [];
}

interface ParsedElement {
  readonly name?: unknown;
  readonly attributes?: unknown;
  readonly inputs?: unknown;
}

export function elementFactsOf(element: object, ancestors?: readonly object[]): ElementFacts {
  const facts = ownFactsOf(element);
  return ancestors === undefined ? facts : { ...facts, ancestors: ancestors.map(ownFactsOf) };
}

function ownFactsOf(element: object): ElementFacts {
  const node = element as ParsedElement;
  const attributes = new Map<string, string | undefined>();
  for (const attribute of listOf(node.attributes)) {
    attributes.set(String(attribute.name), typeof attribute.value === 'string' ? attribute.value : undefined);
  }
  for (const input of listOf(node.inputs)) {
    const name = String(input.name);
    if (ATTRIBUTE_BINDINGS.has(Number(input.__originalType)) && !attributes.has(name)) attributes.set(name, undefined);
  }
  return { name: String(node.name), attributes };
}

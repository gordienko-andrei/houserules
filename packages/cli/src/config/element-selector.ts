export interface AttributeCondition {
  readonly name: string;
  readonly value?: string;
}

export interface ElementSelector {
  readonly source: string;
  readonly tag?: string;
  readonly required: readonly AttributeCondition[];
  readonly excluded: readonly AttributeCondition[];
}

export interface ElementFacts {
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string | undefined>;
}

const TAG = /^[a-zA-Z][\w-]*/;
const ATTRIBUTE = /^\[\s*([a-zA-Z_:@.][\w:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\s*)?\]/;
const NOT_PREFIX = ':not(';
const BINDING_TYPE_PROPERTY = 0;
const BINDING_TYPE_ATTRIBUTE = 1;
const BINDING_TYPE_TWO_WAY = 5;
const ATTRIBUTE_BINDINGS = new Set([BINDING_TYPE_PROPERTY, BINDING_TYPE_ATTRIBUTE, BINDING_TYPE_TWO_WAY]);

function readAttribute(text: string): { condition: AttributeCondition; rest: string } | undefined {
  const match = ATTRIBUTE.exec(text);
  if (match === null) return undefined;
  const value = match[2] ?? match[3] ?? match[4];
  return { condition: value === undefined ? { name: match[1] ?? '' } : { name: match[1] ?? '', value }, rest: text.slice(match[0].length) };
}

export function parseElementSelector(source: string): ElementSelector | undefined {
  const text = source.trim();
  const tag = TAG.exec(text)?.[0];
  const required: AttributeCondition[] = [];
  const excluded: AttributeCondition[] = [];
  let rest = text.slice(tag?.length ?? 0);
  while (rest !== '') {
    const isNegated = rest.startsWith(NOT_PREFIX);
    const attribute = readAttribute(isNegated ? rest.slice(NOT_PREFIX.length) : rest);
    if (attribute === undefined) return undefined;
    if (isNegated) {
      if (!attribute.rest.startsWith(')')) return undefined;
      excluded.push(attribute.condition);
      rest = attribute.rest.slice(1);
    } else {
      required.push(attribute.condition);
      rest = attribute.rest;
    }
  }
  if (tag === undefined && required.length === 0) return undefined;
  return tag === undefined ? { source: text, required, excluded } : { source: text, tag: tag.toLowerCase(), required, excluded };
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

export function renderSampleElement(selector: ElementSelector): string {
  const tag = selector.tag ?? 'div';
  const attributes = selector.required.map((condition) => (condition.value === undefined ? ` ${condition.name}` : ` ${condition.name}="${condition.value}"`)).join('');
  return VOID_ELEMENTS.has(tag) ? `<${tag}${attributes} />` : `<${tag}${attributes}></${tag}>`;
}

export function isCustomElementSelector(selector: ElementSelector): boolean {
  return selector.tag !== undefined && selector.tag.includes('-') && selector.required.length === 0 && selector.excluded.length === 0;
}

export function describeElementSelector(source: string): string {
  const selector = parseElementSelector(source);
  return selector !== undefined && isCustomElementSelector(selector) ? `<${selector.source}>` : `\`${source}\``;
}

// A bound attribute has no static value: it may hold any value, so the element is matched only when that cannot be wrong.
function mayHave(element: ElementFacts, condition: AttributeCondition): boolean {
  if (!element.attributes.has(condition.name)) return false;
  const value = element.attributes.get(condition.name);
  return condition.value === undefined || value === undefined || value === condition.value;
}

function surelyHas(element: ElementFacts, condition: AttributeCondition): boolean {
  if (!element.attributes.has(condition.name)) return false;
  return condition.value === undefined || element.attributes.get(condition.name) === condition.value;
}

export function matchesElementSelector(selector: ElementSelector, element: ElementFacts): boolean {
  return (
    (selector.tag === undefined || element.name.toLowerCase() === selector.tag) &&
    selector.required.every((condition) => surelyHas(element, condition)) &&
    !selector.excluded.some((condition) => mayHave(element, condition))
  );
}

// True when every element the target selects is also selected by the declared selector, so the declaration applies to it.
export function selectorCovers(declared: ElementSelector, target: ElementSelector): boolean {
  if (declared.tag !== undefined && declared.tag !== target.tag) return false;
  return declared.required.every((condition) =>
    target.required.some(
      (candidate) =>
        candidate.name.toLowerCase() === condition.name.toLowerCase() && (condition.value === undefined || candidate.value === condition.value),
    ),
  );
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

export function elementFactsOf(element: object): ElementFacts {
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

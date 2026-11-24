import { matchesElementSelector, type ElementFacts, type ElementSelector } from './element-selector';

const HTML_ATTRIBUTES = new Set(
  [
    'accesskey', 'autocapitalize', 'autocorrect', 'autofocus', 'class', 'contenteditable', 'dir', 'draggable', 'enterkeyhint',
    'hidden', 'id', 'inert', 'inputmode', 'is', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype', 'lang', 'nonce', 'part',
    'popover', 'role', 'slot', 'spellcheck', 'style', 'tabindex', 'title', 'translate', 'writingsuggestions',
    'accept', 'accept-charset', 'action', 'allow', 'alt', 'as', 'async', 'autocomplete', 'autoplay', 'charset', 'checked', 'cite',
    'cols', 'colspan', 'command', 'commandfor', 'content', 'controls', 'coords', 'crossorigin', 'data', 'datetime', 'decoding',
    'default', 'defer', 'dirname', 'disabled', 'download', 'enctype', 'for', 'form', 'formaction', 'formenctype', 'formmethod',
    'formnovalidate', 'formtarget', 'headers', 'height', 'high', 'href', 'hreflang', 'http-equiv', 'integrity', 'kind', 'label',
    'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name',
    'novalidate', 'open', 'optimum', 'pattern', 'ping', 'placeholder', 'playsinline', 'popovertarget', 'popovertargetaction',
    'poster', 'preload', 'readonly', 'referrerpolicy', 'rel', 'required', 'reversed', 'rows', 'rowspan', 'sandbox', 'scope',
    'selected', 'shape', 'size', 'sizes', 'span', 'src', 'srcdoc', 'srclang', 'srcset', 'start', 'step', 'target', 'type',
    'usemap', 'value', 'width', 'wrap',
    'innerhtml', 'innertext', 'textcontent', 'htmlfor', 'classname',
  ],
);

const ANGULAR_BUILT_IN_DIRECTIVES = new Set(
  [
    'ngModel', 'ngModelOptions', 'ngModelGroup', 'ngForm', 'formControl', 'formControlName', 'formGroup', 'formGroupName',
    'formArrayName', 'ngClass', 'ngStyle', 'ngNonBindable', 'ngSkipHydration', 'ngSrc', 'ngSrcset', 'ngTemplateOutlet',
    'ngTemplateOutletContext', 'ngComponentOutlet', 'routerLink', 'routerLinkActive', 'routerLinkActiveOptions', 'queryParams',
    'queryParamsHandling', 'fragment', 'state', 'relativeTo', 'preserveFragment', 'skipLocationChange', 'replaceUrl',
    'ariaCurrentWhenActive',
  ].map((name) => name.toLowerCase()),
);

const STANDARD_PREFIXES = ['aria-', 'data-', 'i18n'];

export function isStandardAttribute(name: string): boolean {
  const lowerName = name.toLowerCase();
  return HTML_ATTRIBUTES.has(lowerName) || ANGULAR_BUILT_IN_DIRECTIVES.has(lowerName) || STANDARD_PREFIXES.some((prefix) => lowerName.startsWith(prefix));
}

// Attributes outside HTML and Angular's own directives most likely belong to a directive of a design system.
export function directiveAttributesOf(element: ElementFacts, selector?: ElementSelector): string[] {
  const named = new Set([...(selector?.required ?? []), ...(selector?.excluded ?? [])].map((condition) => condition.name.toLowerCase()));
  return [...element.attributes.keys()].filter((name) => !isStandardAttribute(name) && !named.has(name.toLowerCase()));
}

export function isPlainNativeMatch(selector: ElementSelector, element: ElementFacts): boolean {
  return matchesElementSelector(selector, element) && directiveAttributesOf(element, selector).length === 0;
}

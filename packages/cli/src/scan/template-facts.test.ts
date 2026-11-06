import { describe, expect, it } from 'vitest';
import { collectTemplateFacts } from './template-facts';

const template = (text: string, firstLine = 1) => ({ file: 'src/app/order.html', text, firstLine });

describe('collectTemplateFacts', () => {
  it('collects custom elements with their attributes and the start tag', () => {
    const facts = collectTemplateFacts(template('<div>\n  <ui-money [value]="order.total" currency="RUB" (click)="open()" />\n</div>'), []);
    expect(facts.elements).toEqual([
      {
        selector: 'ui-money',
        attributeNames: ['click', 'currency', 'value'],
        example: { file: 'src/app/order.html', line: 2, text: '<ui-money [value]="order.total" currency="RUB" (click)="open()" />' },
      },
    ]);
  });

  it('ignores native elements', () => {
    expect(collectTemplateFacts(template('<p><span>a</span></p>'), []).elements).toEqual([]);
  });

  it('collects pipes and money written by hand, shifted by the first line of an inline template', () => {
    const facts = collectTemplateFacts(template('<p>{{ total | currency }}</p>\n<p>{{ debt }} руб.</p>', 10), ['руб.']);
    expect(facts.pipes).toEqual([
      { name: 'currency', example: { file: 'src/app/order.html', line: 10, text: '<p>{{ total | currency }}</p>' } },
    ]);
    expect(facts.handFormattedMoney).toEqual([{ file: 'src/app/order.html', line: 11, text: '<p>{{ debt }} руб.</p>' }]);
  });

  it('reports a template that cannot be parsed', () => {
    const facts = collectTemplateFacts(template('<ui-money [value]="x"'), []);
    expect(facts.parseError).toMatch(/not terminated/);
    expect(facts.elements).toEqual([]);
  });
});

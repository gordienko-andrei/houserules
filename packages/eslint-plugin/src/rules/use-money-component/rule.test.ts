import * as templateParser from '@angular-eslint/template-parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { RULE_NAME, useMoneyComponent } from './rule';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: { parser: templateParser },
});

ruleTester.run(RULE_NAME, useMoneyComponent, {
  valid: [
    '<ui-money [value]="total" currency="RUB" />',
    '<p>{{ total | number }}</p>',
    '<p>{{ count }} items</p>',
    '<p>Discount: {{ discount }}%</p>',
    '<p>Price in $ is shown below</p>',
    {
      code: '<p>{{ total | currency }}</p>',
      options: [{ pipes: ['money'] }],
    },
    {
      code: '<p>{{ total }} USD</p>',
      options: [{ currencyWords: [] }],
    },
  ],
  invalid: [
    {
      code: '<p>Total: {{ total | currency:"RUB" }}</p>',
      errors: [
        {
          messageId: 'moneyPipe',
          data: { target: "the project's money component", pipe: 'currency' },
          line: 1,
          column: 14,
          endColumn: 36,
        },
      ],
    },
    {
      code: '<p>{{ total | currency }}</p>',
      options: [{ component: 'ui-money' }],
      errors: [{ messageId: 'moneyPipe', data: { target: '<ui-money>', pipe: 'currency' } }],
    },
    {
      code: '<span [title]="price | currency | lowercase"></span>',
      errors: [{ messageId: 'moneyPipe' }],
    },
    {
      code: '<p>{{ total | money }}</p>',
      options: [{ pipes: ['currency', 'money'] }],
      errors: [{ messageId: 'moneyPipe', data: { target: "the project's money component", pipe: 'money' } }],
    },
    {
      code: '<p>{{ price }} ₽</p>',
      errors: [{ messageId: 'moneyNextToCurrency', line: 1, column: 7, endColumn: 12 }],
    },
    {
      code: '<b>${{ amount }}</b>',
      options: [{ component: 'ui-money' }],
      errors: [{ messageId: 'moneyNextToCurrency', data: { target: '<ui-money>' } }],
    },
    {
      code: '<i title="Debt: {{ debt }} €"></i>',
      errors: [{ messageId: 'moneyNextToCurrency' }],
    },
    {
      code: '<p>{{ total }} руб.</p>',
      options: [{ currencyWords: ['руб.'] }],
      errors: [{ messageId: 'moneyNextToCurrency' }],
    },
    {
      code: '@if (order) {\n  <p>{{ order.sum }} € / {{ order.items }} items</p>\n}',
      errors: [{ messageId: 'moneyNextToCurrency', line: 2, column: 9 }],
    },
  ],
});

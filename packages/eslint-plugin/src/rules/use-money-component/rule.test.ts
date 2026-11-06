import * as templateParser from '@angular-eslint/template-parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { RULE_NAME, useMoneyComponent } from './rule';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const MONEY_COMPONENT_USAGE = '<ui-money [value]="$value" />';
const MONEY_PIPE_USAGE = '{{ $value | tuiAmount: "RUB" }}';

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
    {
      code: '<p>{{ total | tuiAmount: "RUB" }}</p>',
      options: [{ pipe: 'tuiAmount', pipes: ['currency', 'tuiAmount'], usage: MONEY_PIPE_USAGE }],
    },
    {
      code: '<p>{{ total | currency: "RUB" }}</p>',
      options: [{ pipe: 'currency', usage: '{{ $value | currency: "RUB" }}' }],
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
    {
      code: `<p>Итого: {{ order.total | currency: 'RUB' }}</p>`,
      options: [{ component: 'ui-money', usage: MONEY_COMPONENT_USAGE }],
      errors: [
        {
          messageId: 'moneyPipeUsage',
          data: { value: 'order.total', usage: '<ui-money [value]="order.total" />', pipe: 'currency' },
        },
      ],
    },
    {
      code: '<p>{{ order.debt }} ₽</p>',
      options: [{ component: 'ui-money', usage: MONEY_COMPONENT_USAGE }],
      errors: [
        {
          messageId: 'moneyNextToCurrencyUsage',
          data: { value: 'order.debt', usage: '<ui-money [value]="order.debt" />' },
        },
      ],
    },
    {
      code: '@if (order) {\n  <p>${{ order.totalUsd }}</p>\n}',
      options: [{ component: 'ui-money', usage: MONEY_COMPONENT_USAGE }],
      errors: [
        {
          messageId: 'moneyNextToCurrencyUsage',
          data: { value: 'order.totalUsd', usage: '<ui-money [value]="order.totalUsd" />' },
          line: 2,
        },
      ],
    },
    {
      code: '<p>{{ order.total }} ₽</p>',
      options: [{ pipe: 'tuiAmount', usage: MONEY_PIPE_USAGE }],
      errors: [
        {
          messageId: 'moneyNextToCurrencyUsage',
          data: { value: 'order.total', usage: '{{ order.total | tuiAmount: "RUB" }}' },
        },
      ],
    },
    {
      code: '<p>{{ order.total | tuiAmount }} ₽</p>',
      options: [{ pipe: 'tuiAmount', usage: MONEY_PIPE_USAGE }],
      errors: [
        {
          messageId: 'moneyNextToCurrencyUsage',
          data: { value: 'order.total', usage: '{{ order.total | tuiAmount: "RUB" }}' },
        },
      ],
    },
    {
      code: '<p>{{ total | currency }}</p>',
      options: [{ pipe: 'tuiAmount' }],
      errors: [{ messageId: 'moneyPipe', data: { target: 'the `tuiAmount` pipe', pipe: 'currency' } }],
    },
    {
      code: `<button [attr.aria-label]="'Pay ' + (order.total | currency)">Pay</button>`,
      options: [{ component: 'ui-money', usage: MONEY_COMPONENT_USAGE }],
      errors: [{ messageId: 'moneyPipe', data: { target: '<ui-money>', pipe: 'currency' } }],
    },
    {
      code: '<i title="Debt: {{ debt }} €"></i>',
      options: [{ component: 'ui-money', usage: MONEY_COMPONENT_USAGE }],
      errors: [{ messageId: 'moneyNextToCurrency', data: { target: '<ui-money>' } }],
    },
    {
      code: '<p>{{ price | currency | lowercase }}</p>',
      options: [{ component: 'ui-money', usage: MONEY_COMPONENT_USAGE }],
      errors: [{ messageId: 'moneyPipe', data: { target: '<ui-money>', pipe: 'currency' } }],
    },
    {
      code: '<p>{{ kind === "debt" ? debt : 0 }} ₽</p>',
      options: [{ component: 'ui-money', usage: MONEY_COMPONENT_USAGE }],
      errors: [{ messageId: 'moneyNextToCurrency', data: { target: '<ui-money>' } }],
    },
  ],
});

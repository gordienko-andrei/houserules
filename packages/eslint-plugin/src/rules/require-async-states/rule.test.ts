import { fileURLToPath } from 'node:url';
import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, requireAsyncStates } from './rule';

const ORDERS_PAGE = fileURLToPath(new URL('./fixtures/orders-page.component.html', import.meta.url));
const LEGACY_PAGE = fileURLToPath(new URL('./fixtures/legacy.html', import.meta.url));
const ASYNC_CASES = fileURLToPath(new URL('./fixtures/async-cases.component.html', import.meta.url));

createTemplateRuleTester().run(RULE_NAME, requireAsyncStates, {
  valid: [
    `@if (orders.isLoading()) { <ui-spinner /> }
     @else if (orders.error()) { <p>Error</p> }
     @else { @for (order of orders.value(); track order.id) { <p>{{ order.id }}</p> } @empty { <p>None</p> } }`,
    `@switch (profile.status()) {
       @case ('loading') { <ui-spinner /> }
       @case ('error') { <p>Error</p> }
       @default { <p>{{ profile.value()?.name }}</p> }
     }`,
    `@if (this.orders.isLoading()) {} @if (orders.error()) {}
     @if (orders.value()?.length) { @for (o of orders.value(); track o.id) { <p>{{ o.id }}</p> } } @else { <p>None</p> }`,
    '<input [value]="form.email().value()" />',
    '<p>{{ total() }}</p>',
    '@if (orders$ | async; as orders) { <p>{{ orders.length }}</p> }',
    {
      code: '@if (orders$ | async; as orders) { <p>{{ orders.length }}</p> } @else { <ui-spinner /> }',
      options: [{ asyncPipe: true }],
    },
    { code: '<p>{{ form.value().email }} {{ slider.value() }}</p>', filename: ORDERS_PAGE },
    { code: '<p>{{ store.items.value() }}</p>', filename: ORDERS_PAGE },
    { code: '<p>{{ orders.value() }}</p>', filename: LEGACY_PAGE },
    '<p>{{ orders.value() }}</p>',
  ],
  invalid: [
    {
      code: '<p>{{ orders.value()?.length }} {{ profile.value()?.name }}</p>',
      filename: ORDERS_PAGE,
      errors: [
        { messageId: 'missingStates', data: { resource: 'orders', states: 'loading, error', hints: '`@if (orders.isLoading())`, `@if (orders.error())`' } },
        { messageId: 'missingStates', data: { resource: 'profile', states: 'loading, error', hints: '`@if (profile.isLoading())`, `@if (profile.error())`' } },
      ],
    },
    {
      code: '<p>{{ orders.value() }}</p>',
      filename: LEGACY_PAGE,
      options: [{ resourceFactories: ['apiResource'] }],
      errors: [{ messageId: 'missingStates' }],
    },
    {
      filename: ASYNC_CASES,
      code: '<p>{{ profile.value()?.name }}</p>',
      errors: [
        {
          messageId: 'missingStates',
          data: {
            resource: 'profile',
            states: 'loading, error',
            hints: '`@if (profile.isLoading())`, `@if (profile.error())`',
          },
          line: 1,
          column: 7,
        },
      ],
    },
    {
      filename: ASYNC_CASES,
      code: `@if (orders.isLoading()) { <ui-spinner /> }\n@for (order of orders.value(); track order.id) { <p>{{ order.id }}</p> }`,
      errors: [
        {
          messageId: 'missingStates',
          data: {
            resource: 'orders',
            states: 'error, empty',
            hints: '`@if (orders.error())`, an `@empty` block in `@for`',
          },
          line: 2,
        },
      ],
    },
    {
      filename: ASYNC_CASES,
      code: '@if (page.orders.status() === "resolved") { @for (o of page.orders.value(); track o.id) { <p>{{ o.id }}</p> } }',
      errors: [
        {
          messageId: 'missingStates',
          data: { resource: 'page.orders', states: 'empty', hints: 'an `@empty` block in `@for`' },
        },
      ],
    },
    {
      filename: ASYNC_CASES,
      code: '<p>{{ a.value() }}</p><p>{{ b.value() }}</p>',
      errors: [
        { messageId: 'missingStates', line: 1, column: 7 },
        { messageId: 'missingStates', line: 1, column: 29 },
      ],
    },
    {
      filename: ASYNC_CASES,
      code: '@if (orders$ | async; as orders) { <p>{{ orders.length }}</p> }',
      options: [{ asyncPipe: true }],
      errors: [{ messageId: 'asyncWithoutElse' }],
    },
  ],
});

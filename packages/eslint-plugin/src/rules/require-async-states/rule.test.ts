import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, requireAsyncStates } from './rule';

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
  ],
  invalid: [
    {
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
      code: '@if (page.orders.status() === "resolved") { @for (o of page.orders.value(); track o.id) { <p>{{ o.id }}</p> } }',
      errors: [
        {
          messageId: 'missingStates',
          data: { resource: 'page.orders', states: 'empty', hints: 'an `@empty` block in `@for`' },
        },
      ],
    },
    {
      code: '<p>{{ a.value() }}</p><p>{{ b.value() }}</p>',
      errors: [
        { messageId: 'missingStates', line: 1, column: 7 },
        { messageId: 'missingStates', line: 1, column: 29 },
      ],
    },
    {
      code: '@if (orders$ | async; as orders) { <p>{{ orders.length }}</p> }',
      options: [{ asyncPipe: true }],
      errors: [{ messageId: 'asyncWithoutElse' }],
    },
  ],
});

import { fileURLToPath } from 'node:url';
import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, requireEmptyState } from './rule';

const LISTS = fileURLToPath(new URL('./fixtures/lists.component.html', import.meta.url));

createTemplateRuleTester().run(RULE_NAME, requireEmptyState, {
  valid: [
    { code: '@for (o of orders(); track o.id) { <p>{{ o.id }}</p> } @empty { <p>No orders</p> }', filename: LISTS },
    { code: '@if (orders().length) { <ul>@for (o of orders(); track o.id) { <li>{{ o.id }}</li> }</ul> } @else { <p>No orders</p> }', filename: LISTS },
    { code: '@if (!orders()?.length) { <p>No orders</p> } @else { @for (o of orders(); track o.id) { <p>{{ o.id }}</p> } }', filename: LISTS },
    { code: '@if (orders().length > 0) { @for (o of orders() | slice: 0 : 3; track o.id) { <p>{{ o.id }}</p> } }', filename: LISTS },
    { code: '@for (tab of tabs; track tab) { <button>{{ tab }}</button> }', filename: LISTS },
    { code: '@for (size of sizes; track size) { <span>{{ size }}</span> }', filename: LISTS },
    { code: '@for (item of labels | keyvalue; track item.key) { <span>{{ item.value }}</span> }', filename: LISTS },
    { code: '@for (n of [1, 2, 3]; track n) { <span>{{ n }}</span> }', filename: LISTS },
    {
      code: '@for (o of orders(); track o.id) { <p>{{ o.id }}</p> @for (line of o.lines; track line) { <span>{{ line }}</span> } } @empty { <p>No orders</p> }',
      filename: LISTS,
    },
    '@for (o of orders(); track o.id) { <p>{{ o.id }}</p> }',
    { code: '@for (invoice of invoices.value(); track invoice) { <p>{{ invoice }}</p> }', filename: LISTS },
  ],
  invalid: [
    {
      code: '<ul>\n  @for (o of orders(); track o.id) { <li>{{ o.id }}</li> }\n</ul>',
      filename: LISTS,
      errors: [{ messageId: 'missingEmpty', data: { collection: 'orders()' }, line: 2, column: 3, endColumn: 7 }],
    },
    {
      code: '@for (tag of tags(); track tag) { <span>{{ tag }}</span> }',
      filename: LISTS,
      errors: [{ messageId: 'missingEmpty', data: { collection: 'tags()' } }],
    },
    {
      code: '@if (data(); as d) { @for (gap of d.gaps; track gap) { <span>{{ gap }}</span> } }',
      filename: LISTS,
      errors: [{ messageId: 'missingEmpty', data: { collection: 'd.gaps' } }],
    },
  ],
});

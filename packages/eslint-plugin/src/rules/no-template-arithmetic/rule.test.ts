import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, noTemplateArithmetic } from './rule';

createTemplateRuleTester().run(RULE_NAME, noTemplateArithmetic, {
  valid: [
    "<p>{{ 'Total: ' + total }}</p>",
    '<p>{{ `${first} ${last}` }}</p>',
    '<button (click)="count = count + 1">+</button>',
    '<div [style.width.%]="progress * 100"></div>',
    '@if (spent + reserved > limit) { <p>Over the limit</p> }',
    '@for (row of rows; track row.id) { <td>{{ $index + 1 }}</td> }',
    '@for (row of rows; track row.id; let i = $index) { <td>{{ i + 1 }}</td> }',
    '<p>{{ 60 * 60 }}</p>',
    '<p>{{ -balance }}</p>',
    '<p>{{ a > b }}</p>',
    '<app-pager [hasNext]="index() < items.length - 1" />',
    '<button [disabled]="index === (sections?.length ?? 0) - 1">Next</button>',
    '<p>Step {{ currentIndex() + 1 }} of {{ steps().length }}</p>',
  ],
  invalid: [
    {
      code: '<p>{{ budget.spentUsd + budget.reservedUsd | currency }}</p>',
      errors: [{ messageId: 'arithmetic', data: { expression: 'budget.spentUsd + budget.reservedUsd' }, line: 1, column: 7 }],
    },
    {
      code: '<p>{{ a + b + c }}</p>',
      errors: [{ messageId: 'arithmetic', data: { expression: 'a + b + c' } }],
    },
    {
      code: '<p>{{ percent(window.responded / window.eligible) }}</p>',
      errors: [{ messageId: 'arithmetic', data: { expression: 'window.responded / window.eligible' } }],
    },
    {
      code: '<app-meter [value]="(used / total) * 100" />',
      errors: [{ messageId: 'arithmetic', data: { expression: '(used / total) * 100' } }],
    },
    {
      code: "<p>{{ 'Left: ' + (limit - used) }}</p>",
      errors: [{ messageId: 'arithmetic', data: { expression: 'limit - used' } }],
    },
    {
      code: '<i title="{{ price - discount }}"></i>',
      errors: [{ messageId: 'arithmetic' }],
    },
  ],
});

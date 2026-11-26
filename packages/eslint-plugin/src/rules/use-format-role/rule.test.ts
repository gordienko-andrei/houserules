import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, useFormatRole, type FormatRoleOption, type UseFormatRoleOptions } from './rule';

const DATE_PIPE: FormatRoleOption = {
  role: 'date',
  angularPipe: 'date',
  defaultFormat: 'mediumDate',
  formattingMethods: ['toLocaleDateString', 'toLocaleTimeString'],
  pipe: 'date',
  usage: "{{ $value | date: 'd MMM y' }}",
  formats: ['d MMM y', 'shortTime'],
};

const NUMBER_COMPONENT: FormatRoleOption = {
  role: 'number',
  angularPipe: 'number',
  defaultFormat: '1.0-3',
  formattingMethods: ['toFixed', 'toPrecision'],
  component: 'app-number',
  usage: '<app-number [value]="$value" />',
};

const OPTIONS: [UseFormatRoleOptions] = [{ roles: [DATE_PIPE, NUMBER_COMPONENT] }];

createTemplateRuleTester().run(RULE_NAME, useFormatRole, {
  valid: [
    { code: "<p>{{ sentAt | date: 'd MMM y' }}</p>", options: OPTIONS },
    { code: "<time>{{ sentAt | date: 'shortTime' }}</time>", options: OPTIONS },
    { code: '<p>{{ sentAt | date: format }}</p>', options: OPTIONS },
    { code: '<app-number [value]="count" />', options: OPTIONS },
    { code: "<p>{{ share | percent }}</p>", options: OPTIONS },
    { code: '<p>{{ sentAt | date }}</p>', options: [{ roles: [{ ...DATE_PIPE, formats: ['mediumDate'] }] }] },
    { code: "<p>{{ sentAt | date: 'd MMM' }}</p>", options: [{ roles: [{ ...DATE_PIPE, formats: undefined }] }] },
    "<p>{{ sentAt | date: 'd MMM' }} {{ n | number }}</p>",
  ],
  invalid: [
    {
      code: "<p>{{ sentAt | date: 'd MMM' }}</p>",
      options: OPTIONS,
      errors: [{ messageId: 'formatNotAllowed', data: { pipe: 'date', format: 'd MMM', role: 'date', formats: "`'d MMM y'`, `'shortTime'`" } }],
    },
    {
      code: '<p>{{ sentAt | date }}</p>',
      options: OPTIONS,
      errors: [{ messageId: 'formatNotAllowed', data: { pipe: 'date', format: 'mediumDate', role: 'date', formats: "`'d MMM y'`, `'shortTime'`" } }],
    },
    {
      code: "<p>{{ total | number: '1.0-0' }}</p>",
      options: OPTIONS,
      errors: [{ messageId: 'useRoleUsage', data: { value: 'total', usage: '<app-number [value]="total" />', pipe: 'number' } }],
    },
    {
      code: '<p [title]="total | number">x</p>',
      options: OPTIONS,
      errors: [{ messageId: 'useRole', data: { role: 'number', target: '<app-number>', pipe: 'number' } }],
    },
    {
      code: '<p>{{ score.toFixed(1) }}</p>',
      options: OPTIONS,
      errors: [{ messageId: 'formattingMethod', data: { method: 'toFixed', role: 'number', target: '<app-number>', usage: '<app-number [value]="$value" />' } }],
    },
    {
      code: '<p>{{ sentAt.toLocaleDateString() }}</p>',
      options: OPTIONS,
      errors: [{ messageId: 'formattingMethod', data: { method: 'toLocaleDateString', role: 'date', target: 'the `date` pipe', usage: "{{ $value | date: 'd MMM y' }}" } }],
    },
  ],
});

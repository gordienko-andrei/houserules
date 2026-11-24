import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, restrictedTemplateSyntax, type RestrictedTemplateSyntaxOptions } from './rule';

const DATE_PIPE = 'Show dates with <app-date [value]="…" />, not the date pipe.';
const INNER_HTML = 'Do not bind [innerHTML]: render text or a component.';

const OPTIONS: [RestrictedTemplateSyntaxOptions] = [
  {
    restrictions: [
      { selector: 'BindingPipe[name="date"]', message: DATE_PIPE },
      { selector: 'BoundAttribute[name="innerHTML"]', message: INNER_HTML },
    ],
  },
];

createTemplateRuleTester().run(RULE_NAME, restrictedTemplateSyntax, {
  valid: [
    { code: '<app-date [value]="order.createdAt" />', options: OPTIONS },
    { code: '<p>{{ total | number }}</p>', options: OPTIONS },
    '<p>{{ d | date }}</p>',
  ],
  invalid: [
    {
      code: '<p>Created {{ order.createdAt | date: "dd.MM" }}</p>',
      options: OPTIONS,
      errors: [{ messageId: 'restricted', data: { message: DATE_PIPE }, line: 1, column: 15 }],
    },
    {
      code: '<div>\n  <span [innerHTML]="html"></span>\n</div>',
      options: OPTIONS,
      errors: [{ messageId: 'restricted', data: { message: INNER_HTML }, line: 2 }],
    },
    {
      code: '<button type="button">Save</button>',
      options: [
        {
          restrictions: [
            { selector: 'Element[name="button"]:not(:has(TextAttribute[name="pButton"]))', message: 'Use pButton.' },
            { selector: 'Element[name="button"]:not(:has(TextAttribute[name="pButton"]))', message: 'Ask the design team.' },
          ],
        },
      ],
      errors: [
        { messageId: 'restricted', data: { message: 'Use pButton.' } },
        { messageId: 'restricted', data: { message: 'Ask the design team.' } },
      ],
    },
  ],
});

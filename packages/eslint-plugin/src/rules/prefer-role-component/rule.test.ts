import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, preferRoleComponent, type PreferRoleComponentOptions } from './rule';

const OPTIONS: [PreferRoleComponentOptions] = [
  {
    replacements: [
      { role: 'action', selector: 'button:not([pButton])', component: 'p-button', usage: '<p-button [label]="$value" />' },
      { role: 'toggle', selector: 'input[type=checkbox]', component: 'p-checkbox', usage: '<p-checkbox [binary]="true" />' },
    ],
  },
];

createTemplateRuleTester().run(RULE_NAME, preferRoleComponent, {
  valid: [
    { code: '<p-button label="Save" />', options: OPTIONS },
    { code: '<button pButton type="button">Save</button>', options: OPTIONS },
    { code: '<input type="text" />', options: OPTIONS },
    { code: '<input [type]="kind" />', options: OPTIONS },
    { code: '<button matChipRemove type="button">x</button>', options: OPTIONS },
    { code: '<button class="tab" mat-tab-link [active]="isActive">Tab</button>', options: OPTIONS },
    { code: '<button tuiButton appearance="flat">Go</button>', options: OPTIONS },
    { code: '<button>Save</button>', options: [{ replacements: [] }] },
    '<button>Save</button>',
  ],
  invalid: [
    {
      code: '<div>\n  <button type="button" (click)="retry()">Retry</button>\n</div>',
      options: OPTIONS,
      errors: [
        {
          messageId: 'nativeElement',
          data: { element: 'button', selector: 'button:not([pButton])', role: 'action', component: '<p-button>', usage: '<p-button [label]="$value" />' },
          line: 2,
          column: 3,
          endLine: 2,
          endColumn: 43,
        },
      ],
    },
    {
      code: '<label><input type="checkbox" formControlName="onlyErrors" /> Only errors</label>',
      options: OPTIONS,
      errors: [{ messageId: 'nativeElement', data: { element: 'input', selector: 'input[type=checkbox]', role: 'toggle', component: '<p-checkbox>', usage: '<p-checkbox [binary]="true" />' } }],
    },
    {
      code: '@if (failed) {\n  <button [disabled]="busy">Retry</button>\n}',
      options: OPTIONS,
      errors: [{ messageId: 'nativeElement', line: 2 }],
    },
    {
      code: '<button *ngIf="failed">Retry</button>',
      options: OPTIONS,
      errors: [{ messageId: 'nativeElement' }],
    },
    {
      code: '<button type="button">Retry</button>',
      options: [
        {
          replacements: [
            { role: 'action', selector: 'button:not([mat-button])', component: 'button[mat-button]', usage: '<button mat-button>{{ $value }}</button>' },
          ],
        },
      ],
      errors: [
        {
          messageId: 'nativeElement',
          data: {
            element: 'button',
            selector: 'button:not([mat-button])',
            role: 'action',
            component: '`button[mat-button]`',
            usage: '<button mat-button>{{ $value }}</button>',
          },
        },
      ],
    },
  ],
});

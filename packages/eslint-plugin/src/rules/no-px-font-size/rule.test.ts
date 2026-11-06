import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, noPxFontSize } from './rule';

createTemplateRuleTester().run(RULE_NAME, noPxFontSize, {
  valid: [
    '<p style="font-size: 1.25rem; padding: 8px">a</p>',
    '<p [style.font-size.rem]="1.2">a</p>',
    '<p [style.width.px]="120">a</p>',
    '<p [style.fontSize]="size">a</p>',
    '<app-text [font]="\'12px\'">a</app-text>',
    '<p [ngStyle]="{ \'font-size.rem\': 1, width: \'10px\' }">a</p>',
    '<p class="text-sm">a</p>',
  ],
  invalid: [
    {
      code: '<p style="color: red; font-size: 14px">a</p>',
      errors: [{ messageId: 'pxFontSize', line: 1, column: 4 }],
    },
    { code: '<p style="font: bold 12px Arial">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    { code: '<p [style.font-size.px]="14">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    { code: '<p [style.fontSize]="\'12px\'">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    { code: '<p [style.font-size]="size + \'px\'">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    { code: '<p [ngStyle]="{ \'font-size\': \'10px\' }">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    { code: '<p [ngStyle]="{ \'font-size.px\': 10 }">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    { code: '<p [style]="{ fontSize: \'11px\' }">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    { code: '<p [attr.style]="\'font-size: 9px\'">a</p>', errors: [{ messageId: 'pxFontSize' }] },
    {
      code: '@if (x) {\n  <p style="font-size:14px">a</p>\n}',
      errors: [{ messageId: 'pxFontSize', line: 2 }],
    },
  ],
});

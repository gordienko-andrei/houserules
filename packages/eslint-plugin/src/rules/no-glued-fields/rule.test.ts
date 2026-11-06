import { createTemplateRuleTester } from '../../testing/rule-tester';
import { RULE_NAME, noGluedFields } from './rule';

createTemplateRuleTester().run(RULE_NAME, noGluedFields, {
  valid: [
    '<p>{{ user.firstName }} {{ user.lastName }}</p>',
    '<p>{{ done }} из {{ total }}</p>',
    '<p>{{ from }} – {{ to }}</p>',
    '<p>Итого, {{ total }}</p>',
    '<dl><dt>Роль</dt><dd>{{ user.role }}</dd><dt>Магазин</dt><dd>{{ shop.name }}</dd></dl>',
    '<p [title]="a + \' • \' + b">x</p>',
    '<i title="{{ a }} • {{ b }}"></i>',
    '<a>Подробнее →</a>',
    '<code>a -> b -> c</code>',
  ],
  invalid: [
    {
      code: '<p>{{ user.name }} •{{ user.role }}•магазин «{{ shop.name }}»•задолжность {{ debt }} руб•</p>',
      errors: [{ messageId: 'separator', data: { marker: '•', hint: '' }, line: 1, column: 4 }],
    },
    {
      code: '<p>Товаров: {{ order.itemsCount }}, скидка {{ order.discountPercent }}%</p>',
      errors: [{ messageId: 'separator', data: { marker: ',', hint: '' } }],
    },
    {
      code: '<p>{{ a }} | {{ b }}</p>',
      options: [{ usages: { metric: '<ui-metric [label]="label" [value]="$value" />' } }],
      errors: [
        {
          messageId: 'separator',
          data: { marker: '|', hint: ', for example `<ui-metric [label]="label" [value]="$value" />`' },
        },
      ],
    },
    {
      code: '<p>Было {{ row.source }} → стало {{ row.fixed }}</p>',
      errors: [{ messageId: 'comparison', data: { marker: '→', hint: '' } }],
    },
    {
      code: '@if (row) {\n  <span>{{ row.old }} -> {{ row.new }}</span>\n}',
      errors: [{ messageId: 'comparison', line: 2 }],
    },
    {
      code: '<p>{{ a }} → {{ b }} → {{ c }}</p>',
      errors: [{ messageId: 'steps' }],
    },
    {
      code: '<p>Откройте настройки → выберите профиль → сохраните</p>',
      options: [{ usages: { steps: '<ui-steps [items]="$value" />' } }],
      errors: [
        { messageId: 'steps', data: { marker: '→', hint: ', for example `<ui-steps [items]="$value" />`' } },
      ],
    },
  ],
});

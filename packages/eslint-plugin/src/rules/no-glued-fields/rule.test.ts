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
    `<small>
  @if (platform) {
    {{ platform }} ·
  }
  <span>{{ currency }}</span>
</small>`,
    `<p>
  @for (tag of tags; track tag) {
    {{ tag }},
  }
  {{ more }}
</p>`,
    `<p>
  @if (a) {
    {{ a }} ·
    <b>x</b>
  }
  {{ b }}
</p>`,
    '<p>{{ total }} ·</p>',
    '<p>{{ result.rows }} rows imported: {{ result.added }} added, {{ result.updated }} updated, {{ result.skipped }} skipped.</p>',
    '<h2 class="sr-only">{{ list.title }}, {{ list.items.length }} items</h2>',
    '<span class="cdk-visually-hidden"><b>{{ a }} · {{ b }}</b></span>',
    '<li>Delete it: Settings → Account → Delete account removes it for good.</li>',
  ],
  invalid: [
    {
      code: '<p>{{ user.name }} •{{ user.role }}•магазин «{{ shop.name }}»•задолжность {{ debt }} руб•</p>',
      errors: [{ messageId: 'separator', data: { marker: '•', hint: '' }, line: 1, column: 7 }],
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
      code: `<small>
  @if (platform) {
    {{ platform }} ·
  }
  {{ currency }}</small>`,
      errors: [{ messageId: 'separator', data: { marker: '·', hint: '' }, line: 3 }],
    },
    {
      code: `<p>
  @if (a) {
    @if (b) {
      {{ b }} |
    }
  }
  {{ c }}
</p>`,
      errors: [{ messageId: 'separator', data: { marker: '|', hint: '' }, line: 4 }],
    },
    {
      code: `<span>
  @if (isTv) {
    <b>TV</b>
  }
  {{ movie.title }}, {{ movie.year }}
</span>`,
      errors: [{ messageId: 'separator', data: { marker: ',', hint: '' }, line: 5, column: 6, endLine: 5, endColumn: 35 }],
    },
    {
      code: '<small class="meta">{{ message.sentAt | date }} · {{ message.channel }}</small>',
      errors: [{ messageId: 'separator', data: { marker: '·', hint: '' } }],
    },
    {
      code: '<p>{{ data.orderCount }} orders · {{ data.itemsShipped }} items shipped.</p>',
      errors: [{ messageId: 'separator', data: { marker: '·', hint: '' } }],
    },
    {
      code: '<p>First time: Create a project → wait until it is Ready → invite the team → Publish it.</p>',
      errors: [{ messageId: 'steps', data: { marker: '→', hint: '' } }],
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

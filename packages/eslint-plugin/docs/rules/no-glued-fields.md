# houserules/no-glued-fields

Disallow gluing separate values into one text with separators or arrows.

- Type: suggestion
- Layer: `recommended`
- Autofix: no

## Why

`Иванов Иван •менеджер•магазин «тестовый»•задолжность 1500 руб•` is several values pretending to be one
line. A screen reader reads it as one string, the eye cannot find the debt, and nothing in the markup says
which part is which.

Structure must be defined in the markup, not only by how the text looks:
[WCAG 1.3.1 Info and Relationships](https://www.w3.org/TR/WCAG22/#info-and-relationships).

## What it reports

1. Two or more interpolations in one text node separated by `•`, `·`, `|`, `;` or `,`. Show each value in
   its own element: a metric, a label and value pair, a status.
2. One arrow (`→`, `->`, `=>`, `⇒`) between two interpolations: a change shown as text. Show it as a
   comparison with before and after in separate elements.
3. Two or more arrows between values or between static phrases: steps written as a sentence. Show them as
   a numbered list.

Spaces and words between values are allowed (`{{ first }} {{ last }}`, `{{ done }} из {{ total }}`), and
so are dashes for ranges and `/` for fractions. Text in attributes and inside `<code>`, `<pre>`, `<kbd>`,
`<samp>` is not checked.

## Examples

Incorrect:

```html
<p>{{ user.name }} • {{ user.role }} • {{ shop.name }}</p>
<p>Товаров: {{ order.itemsCount }}, скидка {{ order.discountPercent }}%</p>
<p>Было {{ row.source }} → стало {{ row.fixed }}</p>
<p>Откройте настройки → выберите профиль → сохраните</p>
```

Correct:

```html
<dl>
  <dt>Роль</dt>
  <dd>{{ user.role }}</dd>
  <dt>Магазин</dt>
  <dd>{{ shop.name }}</dd>
</dl>
<ol>
  <li>Откройте настройки</li>
  <li>Выберите профиль</li>
  <li>Сохраните</li>
</ol>
```

## Options

```ts
interface NoGluedFieldsOptions {
  usages?: { metric?: string; comparison?: string; steps?: string };
}
```

With `usages`, the message ends with the call of the project component for that role, for example
`…in its own element, for example <ui-metric [label]="label" [value]="$value" />`.
`configs.recommended()` fills them from the `metric`, `comparison` and `steps` roles of `houserules.config.ts`.

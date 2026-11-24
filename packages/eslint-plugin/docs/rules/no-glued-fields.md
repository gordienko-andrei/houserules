# houserules/no-glued-fields

Disallow gluing separate values into one text with separators or arrows.

- Type: suggestion
- Layer: `recommended`
- Autofix: no

## Why

`Иванов Иван •менеджер•магазин «тестовый»•задолжность 1500 руб•` is several values pretending to be one
line. A screen reader reads it as one string, the eye cannot find the debt, and nothing in the markup says
which part is which.

Lines glued with `·`, `•` or `|` are also the most visible sign of generated markup. A professional
interface gives every value its own element, spaces them with layout and shows what is main and what is
secondary by style, not by punctuation. That is why the rule has no exception for metadata lines such as
`date · channel`.

Structure must be defined in the markup, not only by how the text looks:
[WCAG 1.3.1 Info and Relationships](https://www.w3.org/TR/WCAG22/#info-and-relationships).

## What it reports

1. Two or more interpolations in one text node separated by `•`, `·` or `|`, always. Commas and `;`
   between values are reported too, unless the text is a sentence that ends with `.`, `!` or `?`:
   `{{ added }} added, {{ updated }} updated.` is prose, `{{ title }}, {{ year }}` is glue.
2. One arrow (`→`, `->`, `=>`, `⇒`) between two interpolations: a change shown as text. Show it as a
   comparison with before and after in separate elements.
3. Two or more arrows between values or between static phrases: steps written as a sentence. Show them as
   a numbered list. A menu path is allowed: `Settings → Account → Delete account`, where every item
   starts with a capital letter and has at most six words.
4. A separator after the last value inside an `@if` block, when the next value comes right after the block:
   `@if (platform) { {{ platform }} · } {{ currency }}`. The same glue, split by a condition. A separator
   at the end of a `@for` item is allowed: it joins items of one list.
5. A separator before the first value inside an `@if` block, when a value comes right before the block:
   `{{ label }} @if (context) { · {{ context }} }`. The mirror case of 4; a `@for` item is allowed for the
   same reason.

Spaces and words between values are allowed (`{{ first }} {{ last }}`, `{{ done }} из {{ total }}`), and
so are dashes for ranges and `/` for fractions. Dashes are never reported, even `{{ id }} — {{ message }}`:
a template cannot tell a range (`{{ from }} — {{ to }}`) from glue, and a false report on every range costs
more than a missed one. Text in attributes, inside `<code>`, `<pre>`, `<kbd>`,
`<samp>` and inside elements with the `sr-only`, `visually-hidden` or `cdk-visually-hidden` class is not
checked: nobody sees it glued.

## How to fix

| Glued | Instead |
| --- | --- |
| `{{ date }} · {{ channel }}` in a row subtitle | Each value in its own `<span>` inside a flex container with `gap`. The secondary value gets the muted text style of the project. |
| `{{ count }} · {{ rate }}` in a table cell | The main number as the cell value, the rate next to it as a separate muted element, or its own column. |
| `{{ spent }} · {{ jobs }} jobs` | Two metrics: a label and value pair each, or the metric component of the project. |
| `Page {{ page }} of {{ pages }} · {{ total }} items` | The pagination component of the project, and the total as a separate caption. |
| `{{ location }} · {{ email }} · {{ phone }}` | A list (`<ul>` with inline items and `gap`) or a `<dl>` with labels. |
| `{{ role }}, {{ year }}` | Two elements: the main one as the title, the other as a muted caption. |

## Examples

Incorrect:

```html
<p>{{ user.name }} • {{ user.role }} • {{ shop.name }}</p>
<small>{{ message.sentAt | date }} · {{ message.channel }}</small>
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
<div class="flex gap-2">
  <time>{{ message.sentAt | date }}</time>
  <span class="text-muted">{{ message.channel }}</span>
</div>
<ol>
  <li>Откройте настройки</li>
  <li>Выберите профиль</li>
  <li>Сохраните</li>
</ol>
<p>{{ result.added }} added, {{ result.updated }} updated.</p>
<p>Удалить аккаунт: Настройки → Аккаунт → Удалить</p>
```

## Options

```ts
interface NoGluedFieldsOptions {
  usages?: { metric?: string; comparison?: string; steps?: string };
}
```

Every message ends with a link to this page. With `usages`, the message also names the call of the project
component for that role, for example
`…in its own element, for example <ui-metric [label]="label" [value]="$value" />, space them…`.
`configs.recommended()` fills them from the `metric`, `comparison` and `steps` roles of `houserules.config.ts`.

# houserules/use-money-component

Require money values in Angular templates to be rendered by the project money component or pipe.

- Type: suggestion
- Layer: `recommended`
- Autofix: no

## Why

A project that has a money component (`<ui-money>`, `<app-price>`, …) decides in one place how
amounts look: currency, rounding, sign, colour for debt or profit. When an AI agent or a developer
formats money by hand, every screen shows amounts a little differently, and the product meaning of
the value (is it a debt? is it the key metric?) is lost.

Consistent presentation of the same kind of data across screens is
[Nielsen Norman Group heuristic #4, Consistency and Standards](https://www.nngroup.com/articles/ten-usability-heuristics/).

## What it reports

1. A money pipe in any binding: interpolation, property binding, attribute interpolation.
   By default only Angular's `currency` pipe; add your own pipes with `pipes`.
2. An interpolation written right next to a currency sign: any Unicode currency symbol
   (`$`, `€`, `₽`, `£`, `¥`, …) and, optionally, currency words from `currencyWords`.

The rule does not guess money from field names such as `totalSum`: a name is a hint, not a fact.

## Messages with a ready call

With `usage`, the message contains the exact call to copy, built from the real expression:

```text
Show `order.total` with `<ui-money [value]="order.total" />` instead of the `currency` pipe.
Show `order.debt` with `<ui-money [value]="order.debt" />` instead of formatting it by hand next to a currency sign.
```

A correct fix becomes cheaper than a workaround such as deleting the currency sign. The ready call is
given only where it fits: for a value in text content, not inside a property binding or an attribute.
Elsewhere, and when the expression contains a quote that `usage` also uses, the message names
the component or pipe without a call.

## Examples

Incorrect:

```html
<p>Total: {{ order.total | currency: 'RUB' }}</p>
<p>{{ order.total }} ₽</p>
<p>${{ order.total }}</p>
<span title="Debt: {{ debt }} €"></span>
```

Correct:

```html
<p>Total: <ui-money [value]="order.total" currency="RUB" /></p>
<p>{{ order.itemsCount }} items</p>
<p>Discount: {{ discount }}%</p>
```

## Options

```ts
interface UseMoneyComponentOptions {
  component?: string;
  pipe?: string;
  usage?: string;
  pipes?: string[];
  currencyWords?: string[];
}
```

| Option | Default | Description |
| --- | --- | --- |
| `component` | none | Selector of your money component. It is only used in the message: `Show money with <ui-money> …`. Cannot be set together with `pipe`. |
| `pipe` | none | Name of your money pipe, when the project shows money with a pipe (Taiga UI: `tuiAmount`). This pipe is never reported, even if listed in `pipes`. |
| `usage` | none | How to show a money value, with `$value` in place of the expression: `<ui-money [value]="$value" />` or `{{ $value \| tuiAmount: "RUB" }}`. Take it from a real call in the project and keep only what is the same for every value: a fixed `currency="RUB"` would mislead on a dollar amount. |
| `pipes` | `['currency']` | Pipes that format money. Replaces the default list, so keep `currency` if you need it. |
| `currencyWords` | `[]` | Currency codes or words that count as a currency sign, for example `['USD', 'руб.']`. Matched case-sensitively and as whole words. |

## Usage

With `houserules.configs.recommended()` the rule is on when `houserules.config.ts` maps the `money` role,
and its options come from the role:

```ts
// houserules.config.ts
export default defineConfig({
  roles: {
    money: { component: 'ui-money', usage: '<ui-money [value]="$value" />', files: 'src/app/ui/money/**' },
  },
  currencyWords: ['руб.'],
});
```

By hand:

```js
// eslint.config.js
import templateParser from '@angular-eslint/template-parser';
import { plugin } from 'eslint-plugin-houserules';

export default [
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { houserules: plugin },
    rules: {
      'houserules/use-money-component': [
        'error',
        {
          component: 'ui-money',
          usage: '<ui-money [value]="$value" />',
          pipes: ['currency', 'money'],
          currencyWords: ['руб.'],
        },
      ],
    },
  },
];
```

A project that shows money with a pipe:

```js
'houserules/use-money-component': [
  'error',
  { pipe: 'tuiAmount', usage: '{{ $value | tuiAmount: "RUB" }}' },
],
```

Inline templates (`template:` in `@Component`) are checked when your config extracts them with the
angular-eslint processor, as in a standard `@angular-eslint` setup.

The money component's own template is allowed to format money. The factory turns the rule off for the
`files` of the role; by hand:

```js
{
  files: ['src/app/ui/money/**/*.html'],
  rules: { 'houserules/use-money-component': 'off' },
}
```

## Limitations

- Money formatted in TypeScript (`formatCurrency`, `Intl.NumberFormat` with `style: 'currency'`)
  and passed to the template as a ready string is not detected.
- A currency sign placed in a separate element (`<span>{{ total }}</span><span>₽</span>`) is not detected.
- There is no autofix: inputs of money components differ between projects, and an interpolation inside
  an attribute cannot be replaced with an element.

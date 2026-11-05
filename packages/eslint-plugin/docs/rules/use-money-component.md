# houserules/use-money-component

Require money values in Angular templates to be rendered by the project money component.

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
  pipes?: string[];
  currencyWords?: string[];
}
```

| Option | Default | Description |
| --- | --- | --- |
| `component` | none | Selector of your money component. It is only used in the message: `Show money with <ui-money> …`. |
| `pipes` | `['currency']` | Pipes that format money. Replaces the default list, so keep `currency` if you need it. |
| `currencyWords` | `[]` | Currency codes or words that count as a currency sign, for example `['USD', 'руб.']`. Matched case-sensitively and as whole words. |

## Usage

```js
// eslint.config.js
import templateParser from '@angular-eslint/template-parser';
import houserules from 'eslint-plugin-houserules';

export default [
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { houserules },
    rules: {
      'houserules/use-money-component': [
        'error',
        { component: 'ui-money', pipes: ['currency', 'money'], currencyWords: ['руб.'] },
      ],
    },
  },
];
```

Inline templates (`template:` in `@Component`) are checked when your config extracts them with the
angular-eslint processor, as in a standard `@angular-eslint` setup.

The money component's own template is allowed to format money. Turn the rule off for it:

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

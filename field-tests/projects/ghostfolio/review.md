# Review: ghostfolio

Commit `157e425`, config: money → `<gf-value>`. Report: [report.md](report.md).

A mature project with one money component (`<gf-value>`, 188 uses), so few findings are expected.

## Findings

| Rule | Where | Verdict | Note |
| --- | --- | --- | --- |
| use-money-component | `product-page.html:352` | ok | `${{ price() }} / year`: a price written by hand with `$`. |
| use-money-component | `user-account-membership.html:32` | ok | `{{ baseCurrency }}&nbsp;{{ price }}` |
| use-money-component | `user-account-membership.html:33` | ok | `{{ baseCurrency }}&nbsp;{{ price - coupon }}`: also a price recalculated in the template. |
| use-money-component | `user-account-membership.html:35` | ok | `{{ baseCurrency }}&nbsp;{{ price }}` |
| use-money-component | `api-page.html:116` | ok | `{{ quote.value.marketPrice }} {{ quote.value.currency }}` |
| use-money-component | `black-weeks-2026-page.html:79` | ok | `{{ baseCurrency }}&nbsp;{{ price / 15 \| number }}` |
| use-money-component | `pricing-page.html:177` | ok | `{{ baseCurrency }}&nbsp;{{ price }}` |
| no-glued-fields | `import-activities-dialog.html:54` | ok | `{{ symbol }} · {{ currency }}` in a `<small>` subtitle. Metadata glue is not allowed either: two muted `<span>`s with `gap`. |
| no-glued-fields | `portfolio-filter-form.component.html:28` | ok | The same pattern. |
| no-glued-fields | `account-selector.component.html:44` | ok | The same pattern, with the separator inside `@if`. |

Precision: 10 ok, 0 false.

## Misses

| Rule | Where | Pattern |
| --- | --- | --- |
| use-money-component | `black-weeks-2026-page.html:77` | `{{ baseCurrency }}&nbsp;<strong>{{ price }}</strong>`: the amount is in another element than the currency code. |

## Scan

- Material and Ionic components are `unknown` because the checkout has no `node_modules`.
- Inline templates are only in `*.stories.ts`, so linting `.html` covers the app.

## Fixed after the first run

- The money rule and `scan` missed amounts next to a currency code variable (`{{ baseCurrency }}&nbsp;{{ price }}`): 6 places.
- `no-glued-fields` missed a separator split from the next value by `@if`.
- `scan` counted 14 ways to show money: charts, tables and selectors with a `currency` input were counted too.
  Now only components that show a single value count, and they come first among the candidates.
- `scan` listed `<ng-container>` (446 uses) as a custom element.
- `scan` examples of hand-formatted money pointed at the start of the text, not at the line of the amount.

## Performance

155 templates in 0.7–1.4 s.

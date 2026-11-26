# houserules/no-template-arithmetic

Disallow calculating shown values in templates.

- Type: suggestion
- Layer: `recommended` and `strict`, always `warn`
- Autofix: no

## Why

`{{ budget.spent + budget.reserved | currency }}` adds two amounts the backend already knows. Next to it another
screen adds them differently, rounds them first or forgets a third field, and two screens show two totals for one
budget. The backend is the only source of truth for shown values; when it does not send one, a `computed` signal
or a pipe calculates it once, with a test.

The rule is a warning: a calculation in a template is not always wrong, but it is always worth a look.

## What it reports

`+`, `-`, `*`, `/` and `%` on data in interpolations and property bindings, one report per calculation:

```html
<p>{{ budget.spentUsd + budget.reservedUsd | currency: 'USD' }}</p>
<small>{{ percent(window.responded / window.eligible) }}</small>
<app-meter [value]="(used / total) * 100" />
```

It does not report:

- string concatenation: `{{ 'Total: ' + total }}`, but it reports `limit - used` inside `{{ 'Left: ' + (limit - used) }}`;
- event handlers: `(click)="count = count + 1"`;
- conditions and flags: `@if (spent > limit)`, `[hasNext]="index() < items.length - 1"`;
- style and class bindings: `[style.width.%]="progress * 100"`;
- positions: `$index + 1`, a loop variable such as `i + 1`, and any `x + 1` or `x - 1`;
- literals only: `{{ 60 * 60 }}`.

## How to fix

| In the template | Instead |
| --- | --- |
| `{{ a.spent + a.reserved }}` | A field from the backend, or `readonly committed = computed(() => …)` in the component |
| `{{ percent(responded / eligible) }}` | A rate field from the backend, or a pure pipe that takes both numbers |
| `[value]="(used / total) * 100"` | A `computed` signal, so the same value feeds the meter and its label |

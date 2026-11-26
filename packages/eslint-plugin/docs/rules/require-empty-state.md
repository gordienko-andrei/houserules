# houserules/require-empty-state

Require an empty state for lists of data.

- Type: suggestion
- Layer: `strict` (`warn`), off in `recommended`
- Autofix: no

## Why

A list that comes back empty renders nothing: no message, no hint what to do. The user cannot tell an empty result
from a broken screen. The system should always keep users informed about what is going on:
[Nielsen Norman Group heuristic #1, Visibility of System Status](https://www.nngroup.com/articles/ten-usability-heuristics/).

## What it reports

A top-level `@for` without an `@empty` block, unless an enclosing `@if` checks the same collection:

```html
<!-- Reported -->
<ul>
  @for (order of orders(); track order.id) { <li>{{ order.number }}</li> }
</ul>

<!-- Allowed -->
@for (order of orders(); track order.id) { <li>{{ order.number }}</li> } @empty { <p>No orders yet</p> }

@if (orders().length) {
  <ul>@for (order of orders(); track order.id) { <li>{{ order.number }}</li> }</ul>
} @else {
  <p>No orders yet</p>
}
```

The rule reads the component of the template, like `require-async-states`, and skips:

- lists the component fills with a fixed value: `readonly tabs = ['all', 'open'] as const`, `readonly tabs = TABS`,
  object literals for `keyvalue`, and array literals in the template;
- a `@for` inside another `@for`: a sub-list of an item may stay empty without a message;
- templates whose component file it cannot find.

## Why it is off in `recommended`

A template cannot tell the main list of a screen from a list that may be empty without a word: warnings,
sources, tags, sections of static content passed through an input. On the first field project about half of
the reports were such lists. Turn the rule on where lists of data are the point of the screen, and keep it away
from the rest with `ignores`:

```ts
rules: { 'require-empty-state': { severity: 'warn', ignores: ['src/app/landing/**'] } },
```

`require-async-states` already requires an empty state for a resource shown in `@for`.

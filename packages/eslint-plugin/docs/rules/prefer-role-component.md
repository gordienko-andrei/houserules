# houserules/prefer-role-component

Require the role component instead of the native elements it replaces.

- Type: suggestion
- Layer: `recommended` (`warn`), `strict` (`error`)
- Autofix: no
- On only when a role in `houserules.config.ts` has `replaces`

## Why

A design system often has a component for something HTML already has: a button, a checkbox, a select. An agent
that does not know the convention writes the native element, and a review fixes one place while the same element
stays in the next block. The rule makes the convention visible everywhere at once.

## Configuration

`replaces` lists the native elements the role component is used instead of:

```ts
export default defineConfig({
  roles: {
    action: {
      component: 'p-button',
      usage: '<p-button [label]="$value" />',
      replaces: 'button:not([pButton])',
    },
    toggle: {
      component: 'p-checkbox',
      usage: '<p-checkbox [binary]="true" />',
      replaces: ['input[type=checkbox]'],
      description: 'A boolean choice in a form or a filter.',
    },
  },
});
```

The library is not built in: map what your project already uses (Angular Material, Taiga UI, PrimeNG, an own UI kit).
When the design system is a directive on a native element, the role component is that selector:

```ts
action: {
  component: 'button[mat-flat-button]',
  usage: '<button mat-flat-button (click)="run()">{{ $value }}</button>',
  replaces: 'button',
},
```

A role with `replaces` needs a `component`. The files in `files` of such a role are not checked, so the component
itself may render the native element.

## Selectors

A small subset of CSS selectors, enough to tell a native element from the same element with a library directive:

| Selector | Matches |
| --- | --- |
| `button` | every `<button>` |
| `input[type=checkbox]` | `<input type="checkbox">` |
| `button[type]` | a `<button>` with `type`, static or bound |
| `button:not([pButton])` | a `<button>` without the `pButton` attribute or input |
| `button:not(.filter-pill)`, `button:not([class~=filter-pill])` | a `<button>` without the `filter-pill` class |
| `button:not(th > *)` | a `<button>` that is not a direct child of `<th>` |
| `button:not(nav *)` | a `<button>` that is not inside `<nav>` at any depth |

The last three describe native elements kept on purpose: sortable table headers, filter pills, links styled as
text. Other CSS syntax (combinators outside `:not(...)`, lists, pseudo-classes) is rejected by
`houserules validate`. Values of enumerated HTML attributes compare without case, so `type="CHECKBOX"` matches
`[type=checkbox]`. A bound value (`[type]="kind"`) is unknown to the linter: it never matches `[type=checkbox]`
and always counts as present for `:not(...)`, so the rule stays silent when it cannot be sure.

## Elements with a directive

An element is reported only when it carries no directive. Any attribute or input that is not standard HTML
(`type`, `class`, `disabled`, `aria-*`, `data-*`, `i18n-*` and the like) and not an Angular directive (`formControlName`,
`ngModel`, `routerLink`, `ngClass` and the like) counts as a directive: `<button matChipRemove>`,
`<button mat-tab-link>`, `<button tuiButton>`. So `replaces: 'button'` works for Material, PrimeNG or Taiga
without listing their directives. Attributes named in the selector itself do not count.

The cost is a miss, never a false report: `<button appTooltip>` with a helper directive is skipped, and so is
`<button iconStart="@tui.plus">` whose attribute is only an input. List such attributes in the config, and the
element is checked again:

```ts
export default defineConfig({
  nonComponentAttributes: ['iconStart', 'appTooltip'],
  roles: { /* ... */ },
});
```

Use `:not(...)` only to skip something more. `houserules validate` shows, for every selector in `replaces`, how many
elements it reports and which attributes made it skip the others, and names the attributes that no directive of
the project or its libraries selects on: those are inputs and belong in `nonComponentAttributes`.

## What it reports

```html
<!-- Reported: the action role replaces plain buttons -->
<button type="button" (click)="retry()">Retry</button>

<!-- Allowed -->
<p-button [label]="'Retry'" (onClick)="retry()" />
<button pButton type="button">Retry</button>
```

## Limits

The rule checks only the elements in `replaces`. It does not decide which inputs the component needs: the `usage`
example in the message shows them. Elements created in TypeScript are not checked, and inline templates only with
`configs.recommended({ inlineTemplates: true })`.

# houserules/restricted-template-syntax

Disallow template syntax listed in the project `restrictions`.

- Type: suggestion
- Layer: `recommended` and `strict` (`error`)
- Autofix: no
- On only when `houserules.config.ts` has `restrictions`

## Why

Some conventions of a project are not a role: the team does not use the `date` pipe with ad hoc formats, does not
bind `[innerHTML]`, does not use a deprecated component. Written as text in AGENTS.md, such a rule can be missed.
Written as data with examples, it becomes a checked rule, and the agent sees it in `houserules context`.

## Configuration

```ts
export default defineConfig({
  restrictions: [
    {
      selector: 'BindingPipe[name="date"]',
      message: 'Show dates with <app-date [value]="…" />, it applies the user locale and time zone.',
      bad: '<p>{{ order.createdAt | date: "dd.MM" }}</p>',
      good: '<app-date [value]="order.createdAt" />',
    },
  ],
});
```

- `selector`: an [ESLint selector](https://eslint.org/docs/latest/extend/selectors) over the Angular template AST.
  Useful node types: `Element[name="…"]`, `TextAttribute[name="…"]`, `BoundAttribute[name="…"]`, `BoundEvent[name="…"]`,
  `BindingPipe[name="…"]`. `:has()` and `:not()` work: `Element[name="button"]:not(:has(TextAttribute[name="pButton"]))`.
- `message`: what to use instead. The linter reports it as is, and agents get it with the `good` example.
- `bad` and `good`: `houserules validate` lints both. It fails when `bad` is not reported by this restriction or when
  `good` breaks any Houserules rule, so a restriction cannot silently match nothing.

## `restrictions` or `replaces`

If the rule says "use the component of a role instead of this native element", write `replaces` on the role: the
message takes the role `usage`, and elements that already carry a directive are skipped
([`prefer-role-component`](prefer-role-component.md)). Everything else is a restriction.

## Why not `no-restricted-syntax`

The ESLint core rule works with the same selectors, but in flat config a later block with `no-restricted-syntax`
replaces the options of earlier ones. A separate rule keeps the project restrictions and your own
`no-restricted-syntax` settings independent.

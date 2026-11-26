# Changelog

`@andrewgordienko/houserules` and `eslint-plugin-houserules` are released together with the same version.
Install both at that version.

## 0.2.1

### Changed

- `require-async-states` stays silent when it cannot find the component of the template. 0.2.0 then counted every
  `x.value()` on a property, so `form.value()` and `slider.value()` were reported in a template checked without
  its `.ts` file.

### Fixes

- `inlineTemplates: true` no longer breaks a project without a TypeScript parser. The `.ts` text goes on to ESLint
  only when `typescript-eslint` or `@typescript-eslint/parser` is installed; otherwise only the inline templates
  are checked, instead of a parsing error in every `.ts` file.
- `validate` no longer reports a directive with an extra bare attribute as a second declaration of the role
  (`[tuiButton][loading]` for `button[tuiButton]`). A declaration may still pin a native attribute to a value, as
  `input[type="checkbox"][tuiCheckbox]` does.
- `scan` shows the whole start tag in examples of attribute directives, not only its first line.

### New

- `validate` names repeated groups among the native elements `replaces` reports, such as “9 inside <th>” or “12
  with class jp-pill”, with the `:not(th > *)` or `:not(.jp-pill)` that would keep them native.
- `scan` lists values named with a currency code (`salaryFloorGbp`, `price_usd`) that the template shows as a plain
  value, as one more way money is shown. It is a hint for the setup, not a lint error.

## 0.2.0

### Breaking

- `@angular-eslint/template-parser` is a peer dependency of `@andrewgordienko/houserules` now, so `scan` and
  `validate` parse templates with the compiler of your Angular version. Install it in the project (most Angular
  projects already have it).
- `require-async-states` reads the component of the template. When it finds the component, a `x.value()` call
  counts only if `x` is a resource the component declares: `resource()`, `httpResource()`, `rxResource()`, a
  `Resource`/`ResourceRef`/`HttpResourceRef` type, or a factory from the new `resourceFactories` option.
- `no-glued-fields` reports `·`, `•` and `|` at the end of a `@for` item. A comma there is still allowed.

### Rules

- `no-glued-fields` and `use-money-component` read text built inside an expression: concatenation, template
  literals, a conditional with a text branch, `join()`. These are the forms agents used to get past the rules.
- `no-glued-fields` points the error at the separator. A comma before a phrase shown on a condition is prose, not
  glue. The `separators` option replaces the default `•`, `·`, `|`, `,`, `;`.
- `use-money-component` suggests the amount itself as `$value`, without `number`, `decimal` or `percent`. It also
  finds a currency sign in a neighbouring element (`<span>£</span>{{ amount }}`), a magnitude suffix
  (`{{ amount }}k £`) and money in property bindings.
- `prefer-role-component` selectors take classes (`.pill`, `[class~=pill]`) and excluded ancestors
  (`:not(th > *)`, `:not(nav *)`). Enumerated values compare without case (`type="CHECKBOX"`). The
  `nonComponentAttributes` option lists inputs and helper directives that leave an element native.
- `no-px-font-size` reports Tailwind arbitrary sizes: `text-[12px]`, `text-[length:12px]`, `[font-size:12px]`.

### Config and ESLint

- New config fields: `glueSeparators`, `nonComponentAttributes`, and `rules: { '<rule>': { severity, ignores } }`
  to keep a rule away from some files without `eslint-disable`.
- `configs.recommended({ inlineTemplates: true })` checks `template:` strings of components through the new
  `houserules/inline-templates` processor.
- Without `houserules.config.ts`, `configs.recommended()` warns and returns no blocks instead of failing the whole
  ESLint run.

### CLI

- `scan` lists attribute directives (`button[tuiButton]`) with counts and elements, no longer repeats a root,
  recognises elements of selectors such as `tui-textfield:not([multi])` and of directives such as
  `router-outlet`, and reads selectors with escaped quotes in library typings.
- `validate` finds a declaration that pins a native attribute the role leaves open
  (`input[type="checkbox"][tuiCheckbox]` for `input[tuiCheckbox]`), explains the counts of skipped elements, names
  skipped attributes that no directive selects on, and counts inline templates.
- `init` and `generate` write `AGENTS.md`, `CLAUDE.md` and the skills next to the nearest `AGENTS.md` up to the git
  root, or to `--agents-dir`, and add `--cwd` to the commands in them.
- `context` lists only the rules that are on and the separators from the config. It no longer mentions i18n.

## 0.1.0

First public release: roles, `scan`, `validate`, `generate`, `context`, skills for agents, six ESLint rules and the
stylelint config.

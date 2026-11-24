# Installing and using Houserules

Houserules keeps AI agents and developers inside the design system of an Angular project. You map data roles
(money, status, metric…) to your own components and pipes once, and Houserules:

- writes concise instructions into `AGENTS.md` and agent skills, and supplies selected role mappings on demand;
- checks templates with ESLint and stylesheets with stylelint, so a wrong template fails with a message that names
  the right component.

This guide takes a project from zero to checks in CI.

## Requirements

| What | Version |
| --- | --- |
| Angular | 18+ (`require-async-states` needs the resource API of Angular 19+) |
| ESLint | 9 or 10, flat config (`eslint.config.js`) |
| `@angular-eslint/template-parser` | 18+, usually the same major as Angular |
| TypeScript | 5+ |
| Node.js | 22 (tested) |

## 1. Install

```sh
npm i -D houserules eslint-plugin-houserules
```

Most Angular projects already have `eslint` and `@angular-eslint/template-parser` (they come with
`ng add angular-eslint`). If not, install them too:

```sh
npm i -D eslint @angular-eslint/template-parser
```

### Before the packages are on npm

Build tarballs from this repository and install them into your project:

```sh
# in the Houserules repository
pnpm install
pnpm build
pnpm --filter houserules --filter eslint-plugin-houserules pack --pack-destination "$PWD/../houserules-packs"
```

The tarballs land in `houserules-packs` next to the repository folder (use an absolute path: pnpm runs `pack` in
each package folder).

```sh
# in your project
npm i -D ../houserules-packs/houserules-0.0.0.tgz ../houserules-packs/eslint-plugin-houserules-0.0.0.tgz
```

Use `pnpm pack`, not `npm pack`: pnpm replaces the `workspace:` version of `houserules` in the plugin's
dependencies with a real one. After changing Houserules, pack and install again.

## 2. Create the config

```sh
npx houserules init
```

`init` creates:

New configs select the `recommended` preset. It reports resource-state findings as warnings and leaves
`no-glued-fields` off. Select `preset: 'strict'` to enable all applicable rules as errors. Existing configs
without a preset retain their previous defaults. Explicit `rules` settings override the preset.
The separate `houserules/stylelint` configuration controls stylesheet checks independently.

By default scan searches existing `src`, `apps`, `libs` and `projects` directories and
`sourceRoot` directories declared in `angular.json`. Set
`scan: { roots: ['apps', 'shared'] }` to choose directories relative to the project root.

| File | What it is |
| --- | --- |
| `houserules.config.ts` | The config with no roles yet. |
| `AGENTS.md` | A section between `<!-- houserules:start -->` and `<!-- houserules:end -->`. The rest of the file is kept. |
| `CLAUDE.md` | An `@AGENTS.md` import, so Claude Code reads `AGENTS.md`. Added only if missing. |
| `.claude/skills/houserules-setup/SKILL.md` | How an agent sets up Houserules. |
| `.claude/skills/houserules-plan/SKILL.md` | How an agent plans a screen before writing a template. |
| `.claude/skills/houserules-learn/SKILL.md` | How an agent turns your corrections of its markup into config. |

Commit all of them: they are the context your agents get.

## 3. Map the roles

A role is a kind of data with one way to show it. Built-in roles: `money`, `status`, `metric`, `issue`,
`comparison`, `tip`, `steps`, `code`, `action`. Map only the roles your project has a component or a pipe for.
A role you leave out keeps its rule off: Houserules never asks for a component you do not have.

### With an agent (recommended)

Ask your agent, for example Claude Code:

> Set up Houserules for this project.

It follows the `houserules-setup` skill:

1. runs `npx houserules scan --json` to collect facts;
2. reads the candidate components and pipes;
3. proposes a mapping with evidence, like “money → `<app-money>`: 37 templates, `currency` pipe: 12”;
4. asks you about every doubt (an old and a new component, a price that may not be money);
5. writes `houserules.config.ts`, then runs `validate` and `generate`.

Your part is to confirm the mapping. The agent must not invent components: if something in its proposal is not
in the scan, ask where it comes from.

### By hand

See what the project uses today:

```sh
npx houserules scan
```

```text
Houserules scan: 2 templates

Money is shown in 3 ways:
  - <app-money> component: 1 uses
  - currency pipe: 1 uses
  - by hand next to a currency sign or code: 1 places
      <p>{{ order.total }} руб.</p>  src/app/order.html:2

Money candidates:
  component app-money: 1 uses; name or inputs mention money
  pipe currency: 1 uses; Angular currency pipe
...
```

Then write the config:

```ts
import { defineConfig } from 'houserules';

export default defineConfig({
  roles: {
    money: {
      component: 'app-money',
      usage: '<app-money [value]="$value" />',
      files: 'src/app/ui/money/**',
    },
  },
  currencyWords: ['руб.'],
});
```

- `component` or `pipe`: exactly one of them. For a pipe, for example
  `{ pipe: 'tuiAmount', usage: '{{ $value | tuiAmount: "RUB" }}' }`. `component` is a selector: a custom element
  (`app-money`) or a directive on an element (`button[mat-flat-button]`, `button[pButton]`, `a[tuiButton]`).
  `validate` finds directives declared in the project (`@Directive`, `@Component`) and in installed libraries.
- `usage`: the exact call agents should copy, with `$value` in place of the shown expression. Take it from the most
  common real call in `scan`. Keep only what is the same for every value: do not hard-code `currency="RUB"` if
  amounts come in several currencies.
- `files`: the folder of the component itself. Its own template may format money, so the money rule is off there.
- `currencyWords`: currency codes or words your templates write as text (`руб.`, `USD`).
- `replaces`: native elements the role component is used instead of, for example
  `{ component: 'p-button', usage: '<p-button [label]="$value" />', replaces: 'button:not([pButton])' }`. The
  [`prefer-role-component`](../packages/eslint-plugin/docs/rules/prefer-role-component.md) rule then reports such
  elements everywhere except the role `files`. Elements that already carry a directive (`<button matChipRemove>`) are
  skipped, so `replaces: 'button'` is usually enough.

### Project restrictions

A ban that is not about a role goes to `restrictions`, with examples that `validate` checks:

```ts
restrictions: [
  {
    selector: 'BindingPipe[name="date"]',
    message: 'Show dates with <app-date [value]="…" />.',
    bad: '<p>{{ order.createdAt | date: "dd.MM" }}</p>',
    good: '<app-date [value]="order.createdAt" />',
  },
],
```

The rule of thumb: "use the role component instead of this native element" is `replaces`, everything else is a
restriction. See [`restricted-template-syntax`](../packages/eslint-plugin/docs/rules/restricted-template-syntax.md).

A role can describe a pattern as well as a value. A custom role with a `description` and a full `usage` carries the
inputs your team always sets, for example a data table with gridlines and striped rows. Agents copy the `usage`
from `houserules context`.

### Learn from corrections

After you have corrected a screen an agent built, ask:

> Learn Houserules conventions from my corrections between `<agent commit>` and `<my commit>`.

The `houserules-learn` skill sorts each correction into a config change, a code-review matter (data, logic), a
style matter (tokens, stylelint) or a one-screen decision. It proposes config only for conventions with evidence
elsewhere in the project or your explicit confirmation, then lints the agent's version to show which mistakes the
new config now catches.

All fields are described in the [`houserules` README](../packages/cli/README.md#config).

## 4. Validate and generate

```sh
npx houserules validate
```

```text
✔ config houserules.config.ts is valid.
✔ money: <app-money> found (project, src/app/ui/money/money.component.ts), 1 uses.
✔ money: usage calls <app-money>.
✔ money: usage is a valid template.
✔ money: usage passes Houserules rules.
✔ rule houserules/use-money-component is on.
✔ rule houserules/no-glued-fields is on.
✔ rule houserules/require-async-states is on.
✔ rule houserules/no-px-font-size is on.
```

`validate` checks that every component or pipe exists in the project or in an installed library, that `usage` is a
valid template that calls it, and that `usage` with a sample value passes the rules. It exits with code 1 on
errors.

After every change of the config, update the generated files:

```sh
npx houserules generate
```

## 5. Turn on ESLint

Add the factory to `eslint.config.js`:

```js
import houserules from 'eslint-plugin-houserules';

export default [
  // ...your configs
  ...houserules.configs.recommended(),
];
```

If your config is wrapped in `tseslint.config(...)` or `defineConfig(...)`, pass the blocks as arguments the same
way: `...houserules.configs.recommended()`.

`configs.recommended()` reads `houserules.config.ts` while ESLint loads its config, and returns blocks for
`**/*.html` with the template parser, the rules of the mapped roles, the rules that need no role, and `off` for the
`files` of each role. Options:

| Option | Default | Description |
| --- | --- | --- |
| `cwd` | `process.cwd()` | Where `houserules.config.ts` is. Pass `import.meta.dirname` if ESLint may run from another folder. |
| `config` | none | The config object itself, instead of reading the file. |
| `files` | `['**/*.html']` | Files the rules apply to. |

### CommonJS config

If `eslint.config.js` uses `require` (as generated by older `ng add angular-eslint`), take the default export:

```js
const houserules = require('eslint-plugin-houserules').default;

module.exports = [
  // ...your configs
  ...houserules.configs.recommended({ cwd: __dirname }),
];
```

This needs Node.js 20.19+ or 22.12+, which can `require` ES modules. Node may print an `ExperimentalWarning`.

### Run it

```sh
npx eslint .
```

```text
src/app/order.html
  1:7   error  Show `order.total` with `<app-money [value]="order.total" />` instead of the `currency` pipe   houserules/use-money-component
  2:7   error  Show `order.total` with `<app-money [value]="order.total" />` instead of formatting it by hand next to a currency sign or code   houserules/use-money-component
  3:7   error  Values are glued into one text with `•`. Lines glued with separators are a typical sign of generated markup and are not allowed, metadata lines included. Put each value in its own element, space them with layout (`gap`) and mute the secondary ones. See https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-glued-fields.md   houserules/no-glued-fields
  4:7   error  Font size is set in fixed `px`. Use `rem` or a typography class of the project, so text scales up to 200% (WCAG 1.4.4)   houserules/no-px-font-size
  5:15  error  `items.value()` is shown without these states: loading, error, empty. Add `@if (items.isLoading())`, `@if (items.error())`, an `@empty` block in `@for`   houserules/require-async-states
```

Every message says what to write instead, and the glue message links to its rule page with fixes for
typical cases, so an agent can fix the template without asking.

| Rule | Reports | Needs a role |
| --- | --- | --- |
| [`use-money-component`](../packages/eslint-plugin/docs/rules/use-money-component.md) | Money shown with another pipe or by hand next to a currency sign or code | `money` |
| [`no-glued-fields`](../packages/eslint-plugin/docs/rules/no-glued-fields.md) | Values glued into one text with `·`, `•`, `\|`, commas or arrows | no |
| [`require-async-states`](../packages/eslint-plugin/docs/rules/require-async-states.md) | Resource data without loading, error and empty states | no |
| [`no-px-font-size`](../packages/eslint-plugin/docs/rules/no-px-font-size.md) | Font sizes in `px` in `style` and style bindings | no |

## 6. Turn on stylelint

ESLint sees only templates. For `.css` and `.scss`, extend the stylelint config shipped with `houserules`:

```sh
npm i -D stylelint
```

```json
{ "extends": ["stylelint-config-standard-scss", "houserules/stylelint"] }
```

```text
src/app/order.scss
  1:21  ✖  Font size is set in fixed px. Use rem or a typography token of the project, so text scales up to 200% (WCAG 1.4.4).  declaration-property-unit-disallowed-list
```

Put `houserules/stylelint` last, so that no other config overrides the rule.

## 7. Roll out on an existing project

A project that already has templates will get many errors on the first run. To adopt Houserules without stopping
work:

1. Start with `warn` for the rules with many errors:

   ```ts
   export default defineConfig({
     roles: { /* ... */ },
     rules: { 'use-money-component': 'warn', 'no-glued-fields': 'warn' },
   });
   ```

2. Fix the places from the `scan` summary (“Money is shown in 3 ways”) one by one, or ask an agent to fix them
   by the lint messages.
3. Switch the rules back to `error` (or remove them from `rules`) once a rule is clean.

Agents can request the roles relevant to a new screen while old screens are being fixed.

Do not silence rules with `eslint-disable` comments: an agent copies what it sees and will silence them too.
If a rule is wrong for a case, open an issue with the template.

## 8. Daily use

- **Agents.** Claude Code reads `CLAUDE.md` → `AGENTS.md` and picks up the skills from `.claude/skills/`. Other
  agents that read `AGENTS.md` get the same instruction to retrieve relevant roles. Ask an agent to plan a
  screen first, or to use the `houserules-plan` skill, for screens with backend data.
- **Config changes.** Edit `houserules.config.ts`, run `npx houserules validate` and `npx houserules generate`, and
  commit the config together with the generated files.
- **Editor.** The ESLint server of the editor keeps the config it loaded. After editing `houserules.config.ts`,
  restart it (VS Code: `ESLint: Restart ESLint Server`). `eslint --cache` on the command line sees config changes
  without a restart.

## 9. CI

```sh
npx houserules validate
npx houserules generate --check
npx eslint .
npx stylelint "src/**/*.{css,scss}"
```

`generate --check` detects outdated generated instructions. Role mappings and project guidance are read directly
from the current config by `context`.

## Commands

| Command | What it does |
| --- | --- |
| `houserules init` | Creates the config if missing, writes the `AGENTS.md` section, `CLAUDE.md` import and skills. |
| `houserules scan` | Facts about components, pipes and money in templates. `--json` for agents. |
| `houserules context --list` | List mapped role names and descriptions. |
| `houserules context --roles money,status` | Load selected mappings and project guidance. Use `--guidance` when no role applies. |
| `houserules validate` | Checks the config against the project. Exit code 1 on errors. |
| `houserules generate` | Updates generated files from the config. `--check` only checks them. |

Every command takes `--cwd <path>` for the project root.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `No houserules.config.ts in <path>. Run npx houserules init` | ESLint runs from another folder: pass `cwd: import.meta.dirname` to `recommended()`. |
| `Invalid Houserules <path>:` with a list of fields | Fix the listed fields, for example `roles.money.usage: The money usage must contain $value.` |
| `Rule "houserules/…" needs '@angular-eslint/template-parser'` | Another config sets a different parser for the same `.html` files after Houserules. Put `recommended()` last. |
| `use-money-component` does not report anything | The `money` role is not mapped. Check `npx houserules validate`: the rule shows as off. |
| `validate`: `usage not linted, eslint or eslint-plugin-houserules is not installed` | Install `eslint` and `eslint-plugin-houserules` in the project, not only globally. |
| `validate`: `<x> is not declared in the project or its libraries and is never used` | Check the selector in `component`. For a library component, make sure the library is in `package.json`. |
| The editor shows old errors after a config change | Restart the ESLint server. |

## Limitations

- Templates in `.html` files are checked. Inline `template:` strings in components were not tested yet.
- `require-async-states` checks one template: states handled by a parent component are not seen.
- Sizes behind SCSS variables and mixins (`font-size: $base`) are not checked.

# houserules

Turns the design system of an Angular project into context and checks for AI agents.

> Early preview (0.x): the config format, rule options and messages may change between minor versions.

`houserules.config.ts` maps data roles (money, status, metric…) to the components and pipes of your project.
From it Houserules generates the AGENTS.md section and agent skills, and
[`eslint-plugin-houserules`](https://github.com/gordienko-andrei/houserules/tree/main/packages/eslint-plugin) checks templates against it.

Step by step setup: [Installing and using Houserules](https://github.com/gordienko-andrei/houserules/blob/main/docs/guide.md).

## Commands

```sh
npx houserules init       # create houserules.config.ts, the AGENTS.md section and the skills
npx houserules scan       # facts about components, pipes and money in templates (--json for agents)
npx houserules context --list  # discover configured roles
npx houserules context --roles money  # selected role and project guidance
npx houserules validate   # check that roles map to real components and working calls
npx houserules generate   # update AGENTS.md and the skills after the config changes (--check for CI)
```

All commands take `--cwd <path>`.

## Setting up with an agent

`init` creates an empty config and the skill `.claude/skills/houserules-setup`. Ask your agent to set up
Houserules: it runs `scan`, reads the candidate components, proposes a mapping with evidence
(“`<app-money>` in 37 templates, `currency` pipe in 12”), asks you about every doubt, writes the config and
runs `validate`. A role without a suitable component stays out of the config, and its rule stays off.

## Config

```ts
import { defineConfig } from 'houserules';

export default defineConfig({
  preset: 'recommended',
  roles: {
    money: {
      component: 'app-money',
      usage: '<app-money [value]="$value" />',
      files: 'src/app/ui/money/**',
    },
    // or a pipe: money: { pipe: 'tuiAmount', usage: '{{ $value | tuiAmount: "RUB" }}' },
  },
  currencyWords: ['руб.'],
  glossary: '- **Debt**: a positive value means the client owes money.',
  examples: ['src/app/orders/orders-list.component.ts'],
  rules: { 'require-async-states': 'warn' },
});
```

| Field | Description |
| --- | --- |
| `roles` | Role name → `component` (a custom element `app-money` or a directive on an element `button[mat-flat-button]`) or `pipe`, `usage` with `$value` in place of the shown expression, optional `files` of the component itself, `replaces` with native element selectors the component is used instead of (`button:not([pButton])`, `input[type=checkbox]`) and `description` (required for custom roles). Built-in roles: money, status, metric, issue, comparison, tip, steps, code, action. |
| `currencyWords` | Currency codes or words that count as a currency sign. |
| `restrictions` | Project bans not tied to a role: an ESLint `selector` over the template AST, a `message`, and `bad` and `good` examples that `validate` lints. |
| `moneyPipes` | Pipes that must not format money in templates. Default `['currency']`. |
| `glossary` | Domain terms returned by the context command, in Markdown. |
| `examples` | Reference components agents should copy. |
| `rules` | Severity per rule: `off`, `warn` or `error`. |
| `preset` | `recommended` enables resource-state checks as warnings and leaves the separator rule off. `strict` enables all applicable rules as errors. Configs without a preset keep the original strict defaults. Explicit `rules` override the preset. |
| `scan.roots` | Optional directories relative to the project root. Defaults to existing `src`, `apps`, `libs`, `projects` and `angular.json` source roots, or the project root when none exist. |

`validate` checks that every component or pipe exists in the project or in an installed library, that `usage`
is a valid template calling it, and that `usage` with a sample value passes the Houserules rules.
Template parsing does not verify Angular imports, input types or business semantics. A target seen in a template
without a declaration is reported as unconfirmed. Library declarations are checked even before first use.

## Stylesheets

`houserules/stylelint` is a stylelint config that forbids `px` font sizes in `.css` and `.scss`:

```json
{ "extends": ["houserules/stylelint"] }
```

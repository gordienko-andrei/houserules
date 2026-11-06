# houserules

Turns the design system of an Angular project into context and checks for AI agents.

`houserules.config.ts` maps data roles (money, status, metric…) to the components and pipes of your project.
From it Houserules generates the AGENTS.md section and agent skills, and
[`eslint-plugin-houserules`](../eslint-plugin) checks templates against it.

## Commands

```sh
npx houserules init       # create houserules.config.ts, the AGENTS.md section and the skills
npx houserules scan       # facts about components, pipes and money in templates (--json for agents)
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
| `roles` | Role name → `component` or `pipe`, `usage` with `$value` in place of the shown expression, optional `files` of the component itself and `description` (required for custom roles). Built-in roles: money, status, metric, issue, comparison, tip, steps, code, action. |
| `currencyWords` | Currency codes or words that count as a currency sign. |
| `moneyPipes` | Pipes that must not format money in templates. Default `['currency']`. |
| `glossary` | Domain terms for AGENTS.md, in Markdown. |
| `examples` | Reference components agents should copy. |
| `rules` | Severity per rule: `off`, `warn` or `error`. |

`validate` checks that every component or pipe exists in the project or in an installed library, that `usage`
is a valid template calling it, and that `usage` with a sample value passes the Houserules rules.

## Stylesheets

`houserules/stylelint` is a stylelint config that forbids `px` font sizes in `.css` and `.scss`:

```json
{ "extends": ["houserules/stylelint"] }
```

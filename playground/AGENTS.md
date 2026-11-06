<!-- houserules:start -->
## Houserules: how this project shows data

Generated from `houserules.config.ts` by `npx houserules generate`. Do not edit this section by hand.

Before you build or change a screen that shows backend data, follow `.claude/skills/houserules-plan/SKILL.md`: read the data types, give every shown field a role, then write the template.

### Roles and components

| Role | When | Show with (`$value` is the shown expression) |
| --- | --- | --- |
| money | An amount of money. Currency, rounding, sign and colour are decided by one component or pipe. | `<ui-money [value]="$value" />` |

The project has no component for: status, metric, issue, comparison, tip, steps, code, action. Use plain semantic markup for them and do not invent components.

### Rules for every screen

- One meaning, one element. Never glue different values into one line with `•`, `|`, commas or arrows.
- The backend is the only source of truth. Do not recalculate values, rewrite messages or parse their text.
- Tone follows the real state: green only after success is a fact, never "rows are valid" before the operation is applied.
- A fix hint stands next to the error it belongs to, and only if the backend provides it.
- Async data shows loading, error and empty states.
- Font sizes use `rem` or project typography classes, never fixed `px`.
- Texts come from the project i18n, not hard-coded in templates.

### Checks

ESLint (`eslint-plugin-houserules`) checks templates. Run it after changing a template and fix every error:

- `houserules/use-money-component`: money is shown only with the money component or pipe from the table above.
- `houserules/no-glued-fields`: separate values are never glued into one text with separators, commas or arrows.
- `houserules/require-async-states`: async data has loading, error and (for lists) empty states.
- `houserules/no-px-font-size`: font sizes are not set in fixed `px`.

Do not silence these rules with `eslint-disable`, do not remove currency signs or move formatting to TypeScript to make the linter pass. If a rule looks wrong for a case, say so in your answer.
<!-- houserules:end -->

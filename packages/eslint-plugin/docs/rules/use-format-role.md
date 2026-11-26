# houserules/use-format-role

Require dates, numbers and percents to be shown by the role the project maps for them.

- Type: suggestion
- Layer: `recommended`
- Autofix: no
- On only when `houserules.config.ts` maps a `date`, `number` or `percent` role

## Why

`{{ sentAt | date: 'd MMM' }}` on one screen, `'d MMM y'` on the next and `'mediumDate'` on the third: every
format is fine alone, together they make one product look like three. An agent picks a format that looks
reasonable for the screen in front of it, so the formats multiply with every task.

Consistent presentation of the same kind of data is
[Nielsen Norman Group heuristic #4, Consistency and Standards](https://www.nngroup.com/articles/ten-usability-heuristics/).
It is the same idea as `use-money-component`, for dates, plain numbers and percents.

## Configuration

Map the role to the component or pipe that shows it. A role shown with the Angular pipe itself lists the
formats the product uses:

```ts
export default defineConfig({
  roles: {
    date: { pipe: 'date', usage: "{{ $value | date: 'd MMM y' }}", formats: ['d MMM y', 'shortTime'] },
    number: { component: 'app-number', usage: '<app-number [value]="$value" />', files: 'src/app/ui/number/**' },
    percent: { pipe: 'percent', usage: "{{ $value | percent: '1.0-1' }}", formats: ['1.0-1'] },
  },
});
```

`formats` are written without quotes. A role with a component or another pipe decides the format itself, so it
takes no `formats`.

## What it reports

| Role | Angular pipe | Formatting methods |
| --- | --- | --- |
| `date` | `date` | `toLocaleDateString()`, `toLocaleTimeString()` |
| `number` | `number` | `toFixed()`, `toPrecision()` |
| `percent` | `percent` | none |

1. The Angular pipe of the role, when the role is shown with a component or another pipe. In text the message
   gives the ready call: `` Show `total` with `<app-number [value]="total" />` instead of the `number` pipe. ``
2. The Angular pipe of the role with a format outside `formats`, when the role is shown with that pipe. A call
   without an argument uses the default of the pipe: `mediumDate` for `date`, `1.0-3` for `number`, `1.0-0` for
   `percent`. A format from a variable (`date: format`) is not checked.
3. A formatting method of the role in a template: `{{ score.toFixed(1) }}`.

The files in `files` of the role are not checked, so the component may use the pipe inside.

## Examples

Incorrect, with the configuration above:

```html
<p>{{ sentAt | date: 'd MMM' }}</p>
<p>{{ total | number: '1.0-0' }}</p>
<p>{{ score.toFixed(1) }}</p>
```

Correct:

```html
<p>{{ sentAt | date: 'd MMM y' }}</p>
<time>{{ sentAt | date: 'shortTime' }}</time>
<app-number [value]="total" />
```

## Limits

The rule sees templates only: a value formatted in TypeScript and shown as a string is not seen. Custom methods
such as `percent(value)` in the component are not recognised either; map the role and move them into its pipe.

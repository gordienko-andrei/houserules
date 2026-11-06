# Review: films

Commit `fce553c` (`master`), app in `UI/ReviewFlix`, no config. Report: [report.md](report.md).

A small movie reviews app on Angular 19 with PrimeNG: 12 templates, 12 stylesheets. It has no money, so the
money rule is off, and no ESLint setup: to use Houserules here, install `eslint` and
`@angular-eslint/template-parser` 19 first.

## Findings

| Rule | Where | Verdict | Note |
| --- | --- | --- | --- |
| no-glued-fields | `navbar.component.html:30` | ok | `{{ movie.title }}, {{ movie.year }}` in an autocomplete option. The title should be the main text and the year a muted caption. |
| stylelint px font size | `styles.scss:11` | ok | `html, body { font-size: 16px }`: the root size in `px` overrides the browser font setting for the whole app. |

Precision: 2 ok, 0 false.

## Misses

| Rule | Where | Pattern |
| --- | --- | --- |
| require-async-states | all pages | Data comes from `subscribe()` into plain fields (17 calls) with `loading` flags and skeletons. No template has an error state or `@empty`, but the rule sees only Angular resources, so it reports nothing. |

## Scan

- Money: nothing found, which is right.
- PrimeNG components are `unknown` because the checkout has no `node_modules`.

## Fixed after the first run

- `no-glued-fields` reported the glue at the line of the `}` before the text (29), not at the values (30).
  Now it points at the glued values.

## Performance

12 templates in 0.2 s, 12 stylesheets in 0.4 s.

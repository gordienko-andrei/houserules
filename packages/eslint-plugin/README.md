# eslint-plugin-houserules

ESLint rules for Angular templates that keep AI agents and developers inside your design system.

> Early preview (0.x): the config format, rule options and messages may change between minor versions.

Step by step setup: [Installing and using Houserules](https://github.com/gordienko-andrei/houserules/blob/main/docs/guide.md).

## Rules

| Rule | Description | Needs a role |
| --- | --- | --- |
| [`use-money-component`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/use-money-component.md) | Require money values to be rendered by the project money component or pipe | `money` |
| [`no-glued-fields`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-glued-fields.md) | Disallow gluing separate values into one text with separators or arrows | no |
| [`require-async-states`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/require-async-states.md) | Require loading, error and empty states where async data is shown | no |
| [`no-px-font-size`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-px-font-size.md) | Disallow font sizes in fixed `px` in Angular templates | no |
| [`prefer-role-component`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/prefer-role-component.md) | Require the role component instead of the native elements it replaces | any role with `replaces` |
| [`restricted-template-syntax`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/restricted-template-syntax.md) | Disallow template syntax listed in the project restrictions | no, needs `restrictions` |
| [`use-format-role`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/use-format-role.md) | Require dates, numbers and percents to be shown by the role the project maps for them | `date`, `number` or `percent` |
| [`require-empty-state`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/require-empty-state.md) | Require an empty state for lists of data (`strict` only) | no |
| [`no-template-arithmetic`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-template-arithmetic.md) | Disallow calculating shown values in templates (`warn`) | no |
| [`no-hardcoded-plural`](https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-hardcoded-plural.md) | Disallow a number followed by a fixed English plural noun (`strict` only) | no |

A rule that needs a role is on only when `houserules.config.ts` maps that role to a component or a pipe.
Requiring a component the project does not have would push an agent to invent one or to work around the check.

## Setup

Requires ESLint 9+ with flat config, `@angular-eslint/template-parser` 18+ and `houserules`.

```sh
npm i -D eslint-plugin-houserules @andrewgordienko/houserules
npx houserules init
```

```js
// eslint.config.mjs
import houserules from 'eslint-plugin-houserules';

export default [
  // ...your configs
  ...houserules.configs.recommended({ cwd: import.meta.dirname }),
];
```

Use `eslint.config.mjs`, or `.js` in a package with `"type": "module"`, so Node does not print
`MODULE_TYPELESS_PACKAGE_JSON` on every run.

`configs.recommended()` reads `houserules.config.ts` from the current directory while ESLint loads its config,
and returns blocks for `**/*.html`: rules for the mapped roles, rules that need no role, and `off` for the files
of each role's own component and the `ignores` of each rule. Without `houserules.config.ts` it warns and returns no
blocks, so the rest of the ESLint config keeps working. Options:

| Option | Default | Description |
| --- | --- | --- |
| `cwd` | `process.cwd()` | Where to look for `houserules.config.ts`, for example `import.meta.dirname`. |
| `config` | none | The config object itself, instead of reading the file. |
| `files` | `['**/*.html']` | Files the rules apply to. |
| `inlineTemplates` | `false` | Also check `template:` strings of components through the `houserules/inline-templates` processor. The `.ts` text is passed on to your TypeScript rules only when a TypeScript parser is installed. Leave it off if angular-eslint already extracts inline templates. |
| `inlineTemplateFiles` | `['**/*.ts']` | Files the processor reads. |

`eslint --cache` sees changes of `houserules.config.ts`, because they change the computed config. The ESLint
server in an editor keeps the config it loaded: restart it after editing `houserules.config.ts`.

### Without the factory

Rules can be configured by hand with the named `plugin` export:

```js
import templateParser from '@angular-eslint/template-parser';
import { plugin } from 'eslint-plugin-houserules';

export default [
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { houserules: plugin },
    rules: {
      'houserules/use-money-component': [
        'error',
        { component: 'ui-money', usage: '<ui-money [value]="$value" />' },
      ],
    },
  },
];
```

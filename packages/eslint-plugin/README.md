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

A rule that needs a role is on only when `houserules.config.ts` maps that role to a component or a pipe.
Requiring a component the project does not have would push an agent to invent one or to work around the check.

## Setup

Requires ESLint 9+ with flat config, `@angular-eslint/template-parser` 18+ and `houserules`.

```sh
npm i -D eslint-plugin-houserules houserules
npx houserules init
```

```js
// eslint.config.js
import houserules from 'eslint-plugin-houserules';

export default [
  // ...your configs
  ...houserules.configs.recommended(),
];
```

`configs.recommended()` reads `houserules.config.ts` from the current directory while ESLint loads its config,
and returns blocks for `**/*.html`: rules for the mapped roles, rules that need no role, and `off` for the files
of each role's own component. Options:

| Option | Default | Description |
| --- | --- | --- |
| `cwd` | `process.cwd()` | Where to look for `houserules.config.ts`, for example `import.meta.dirname`. |
| `config` | none | The config object itself, instead of reading the file. |
| `files` | `['**/*.html']` | Files the rules apply to. |

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

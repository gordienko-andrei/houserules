# eslint-plugin-houserules

ESLint rules for Angular templates that keep AI agents and developers inside your design system.

## Rules

| Rule | Description |
| --- | --- |
| [`use-money-component`](docs/rules/use-money-component.md) | Require money values to be rendered by the project money component or pipe |

## Setup

Requires ESLint 9+ with flat config and `@angular-eslint/template-parser` for `*.html` files.

```js
// eslint.config.js
import templateParser from '@angular-eslint/template-parser';
import houserules from 'eslint-plugin-houserules';

export default [
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { houserules },
    rules: {
      'houserules/use-money-component': [
        'error',
        { component: 'ui-money', usage: '<ui-money [value]="$value" />' },
      ],
    },
  },
];
```

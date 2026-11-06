# Houserules

Your design system, enforced for AI agents: a config of data roles and project components for Angular, generated agent context and ESLint checks for templates.

## Getting started

[Installing and using Houserules](docs/guide.md): install, map roles with an agent or by hand, turn on ESLint
and stylelint, roll out on an existing project, set up CI.

## Packages

| Package | Description |
| --- | --- |
| [`houserules`](packages/cli) | Config, CLI (`init`, `scan`, `validate`, `generate`) and agent context |
| [`eslint-plugin-houserules`](packages/eslint-plugin) | ESLint rules for Angular templates and `configs.recommended()` |

## Development

Requires Node.js 22+ and pnpm.

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm playground
```

[`playground`](playground) shows the rules on sample Angular templates.
[`field-tests`](field-tests) runs them on real open-source projects: `pnpm field-test ghostfolio`.

## License

[MIT](LICENSE)

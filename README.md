# Houserules

Your design system, enforced for AI agents: a config of data roles and project components for Angular, generated agent context and ESLint checks for templates.

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

## License

[MIT](LICENSE)

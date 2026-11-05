# Playground

A sandbox to see Houserules rules on real Angular templates. It is not published.

`eslint.config.js` connects `eslint-plugin-houserules` the same way a user project does,
so if a rule works here, it works for users.

## Run

From the repository root:

```sh
pnpm playground
```

The command builds the plugin (`packages/eslint-plugin/dist`) and runs ESLint on `src/`.
Exit code 1 is expected: `*.bad.html` files contain errors on purpose.

Expected result:

| File | Errors |
| --- | --- |
| `src/app/order/order-summary.bad.html` | 5 |
| `src/app/order/order-summary.good.html` | 0 |
| `src/app/ui/money/money.component.html` | 0, the rule is turned off for the money component itself |

## Files

- `*.bad.html` shows what an AI agent typically writes. Every violation is reported.
- `*.good.html` is the same screen written correctly. It must stay clean.
- `src/app/ui/` holds the project's own components, which are allowed to format data.

## Trying a new rule or a new case

1. Add the case to a `*.bad.html` file, or a new pair `name.bad.html` / `name.good.html`.
2. Turn the rule on in `eslint.config.js`.
3. Run `pnpm playground` and check the errors.

The playground is for looking at results. Behaviour is pinned by `RuleTester` tests in
`packages/eslint-plugin`, so a case found here should also become a test.

## VS Code

To see errors in the editor, install the ESLint extension (`dbaeumer.vscode-eslint`) and run
`pnpm playground` once so that the plugin is built. After changing the plugin code, run it again
and restart the ESLint server (command palette: `ESLint: Restart ESLint Server`).

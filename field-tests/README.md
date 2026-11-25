# Field tests

Runs Houserules on real Angular projects to find crashes, false positives and misses before users do.
It is not published.

## Run

From the repository root:

```sh
pnpm field-test ghostfolio
```

The command builds the packages, then for the project:

1. checks out the pinned commit into `.checkouts/<project>` (shallow, not committed);
2. runs `scan` with the project config;
3. lints every `.html` template with `configs.recommended()` only, ignoring the project's own ESLint config;
4. lints every `.css` and `.scss` file with `@andrewgordienko/houserules/stylelint` only;
5. writes `projects/<project>/report.md`: versions, time, crashes, parse errors, counts per rule, findings with
   code, and the scan summary.

The project's dependencies are not installed, so library components show up in `scan` as `unknown`.

## Adding a project

Create `projects/<name>/project.json`:

```json
{ "repository": "https://github.com/owner/repo.git", "ref": "<commit sha>" }
```

Pin a commit, not a branch, so reports stay comparable. If the Angular app is in a subfolder, add
`"root": "path/to/app"`: only that folder is scanned and linted.

Run once with no config to see the role-free rules and the scan, then add `projects/<name>/houserules.config.ts`
with the roles the scan shows, the way a user would.

Reports quote the project's templates. For a private project, keep its folder out of git with a line in
`.git/info/exclude`, for example `field-tests/projects/<name>/`, so its code never reaches the repository.

## Reviewing

`report.md` is regenerated on every run. Write verdicts in `projects/<name>/review.md`:

- every finding: `ok` (a real problem), `false` (a false positive) or `?` (disputed);
- misses: patterns a rule should have reported, found by reading templates or by grep;
- problems of `scan`: wrong candidates, wrong counts.

Every false positive and miss that we decide to fix becomes a `RuleTester` test in `packages/eslint-plugin`.

## Projects

| Project | Why |
| --- | --- |
| [ghostfolio](projects/ghostfolio/review.md) | Finance app with its own money component, Angular 22, Nx, CommonJS ESLint config |
| [films](projects/films/review.md) | Small app without money and without ESLint, Angular 19, PrimeNG, data from `subscribe()` |

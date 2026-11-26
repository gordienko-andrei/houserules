---
name: houserules-learn
description: Turn corrections of agent-written Angular markup into Houserules config. Use when the user has corrected a screen built by an agent (two commits, a branch, a changelog with both versions) and wants the conventions kept for the next screens.
---

# Learn conventions from corrections

A correction becomes config only when it is a convention of the whole project, not the taste of one screen. Never write the config before the user confirms.

1. **Get both versions.** The agent's version and the corrected one: two commits (`git diff <before> <after> -- '*.html' '*.scss' '*.ts'`), a branch, or a document with both. Without both versions, stop and ask.
2. **List the corrections.** One line each: before, after, `file:line`. Merge repeated changes into one line with a count.
3. **Sort every correction into one kind:**
   - *Component instead of native or hand-made markup* (`<button>` → the button component, a hand-made expand toggle → the library one): a role with `replaces`.
   - *A value shown through a component* (plain text → a tag with a tone, `a → b` → a before/after view): a role (`status`, `comparison`, `money` or a custom role with `description`).
   - *The same inputs added to a component* (a table with gridlines, a small button): the `usage` of a role.
   - *A ban not tied to a role* (a pipe, a binding or an attribute the team does not use, such as `[innerHTML]`): a `restrictions` entry with an ESLint selector over the template AST, a message, `bad` taken from the agent's version and `good` from the corrected one.
   - *Data and business logic* (fields, requests, error handling): not Houserules, it stays in the code review.
   - *Styles and layout* (spacing, colours, heights): not Houserules; suggest design tokens or the project stylelint.
   - *One screen only* (a filter moved under another one): not a convention, skip it.
   - *A rule that is right in general but not for some files* (a template that renders a document, such as a resume): `rules: { '<rule>': { ignores: ['<glob>'] } }`, never an `eslint-disable` comment.
4. **Check every candidate against the project, not this diff.** Run `npx houserules scan --json` and search the templates. A convention needs evidence outside the corrected screen (the component is used elsewhere, the native element is rare or old code) or an explicit "everywhere" from the user. Note the counts.
5. **Propose a table**: correction → config change → kind → evidence. Mark doubts and ask about them: a library default may not be the team convention.
6. **Write the config after confirmation.** Build `usage` from a real call in the project and keep only inputs that are the same for every use. For `replaces` use a selector that leaves the library directive alone, for example `button:not([pButton])`.
7. **Validate and generate.** Run `npx houserules validate`, fix what it reports, then `npx houserules generate`. `validate` lints every `bad` and `good` example and shows which elements `replaces` reports and which it skips because they carry a directive.
8. **Prove it on the agent's version.** Lint each corrected template as the agent wrote it, for example `git show <before>:<path> | npx eslint --stdin --stdin-filename <path>`. Report which corrections the linter now catches, which remain guidance in role descriptions, and which are out of scope.
9. **Report other violations** in the project (`npx eslint`) as a separate list. Do not fix them in this task.

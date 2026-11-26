import type { HouserulesConfig } from '../config/schema';

export const SKILLS_DIRECTORY = '.claude/skills';
export const PLAN_SKILL_NAME = 'houserules-plan';
export const SETUP_SKILL_NAME = 'houserules-setup';
export const LEARN_SKILL_NAME = 'houserules-learn';

export interface GeneratedFile {
  readonly path: string;
  readonly content: string;
}

export function renderPlanSkill(_config: HouserulesConfig): string {
  return `---
name: ${PLAN_SKILL_NAME}
description: Plan how a screen shows its data before writing an Angular template. Use before building or changing any screen, card or table that shows backend data.
---

# Plan a screen before writing the template

Run \`npx houserules context --list\` to see mapped roles and their descriptions.

1. **Read the data contract.** Open the TypeScript types or the OpenAPI schema of the data the screen shows. Do not plan from field names in the template alone.
2. **Give every shown field a role**, or plain text. Run \`npx houserules context --roles money,status\` with the relevant role names to load their usage and project guidance.
3. **Mark doubts instead of guessing.** If you cannot tell whether a number is money or a count, what its sign means, or which currency it has, put a question in the plan and ask the user. A wrong guess (a green debt) is worse than a question.
4. **Check the states** according to the returned project guidance.
5. **Write the template** with the returned components, copying their \`usage\` exactly and putting the real expression in place of \`$value\`.
6. **Run ESLint** on the changed templates and fix every \`houserules/*\` error by following its message.

Apply the returned project rules and preserve business differences between screens.
`;
}

export function renderSetupSkill(): string {
  return `---
name: ${SETUP_SKILL_NAME}
description: Set up Houserules for this Angular project, that is map data roles (money, status, metric…) to the project components and pipes in houserules.config.ts. Use when the user asks to set up, configure or update Houserules.
---

# Set up Houserules

You fill \`houserules.config.ts\`; the user only confirms. Never invent a component or a call.

1. **Collect facts.** Run \`npx houserules scan --json\`. It lists custom elements and pipes with usage counts and the most common real calls, money candidates and money formatted by hand.
2. **Read the candidates.** Open the code of every candidate component or pipe. Check its inputs, whether it is deprecated, and where it is used.
3. **Propose a mapping with evidence.** For each role give the component or pipe, the number of uses and two or three files, for example: "money → \`<app-money>\`: 37 templates, \`currency\` pipe: 12, e.g. src/app/orders/order.html:14".
4. **Build \`usage\` from a real call.** Take the most common call from the scan and replace the shown expression with \`$value\`. Keep only what is the same for every value: do not hard-code \`currency="RUB"\` if amounts come in several currencies.
5. **Ask the user** to confirm the mapping. Ask about every doubt: an old and a new component, a price that may not be money, a pipe that formats more than money. A role with no suitable component stays out of the config, and its rule stays off.
6. **Write the config.** Set \`files\` of a role to the folder of its component, so the component may format its own value. Add \`currencyWords\` if the project writes currencies as words (\`руб.\`, \`USD\`). If the project uses a component instead of a native element (a button, a checkbox, a select), add \`replaces\` with a selector that leaves the library directive alone, for example \`button:not([pButton])\`. If the design system puts a directive on a native element (Angular Material \`<button mat-flat-button>\`, PrimeNG \`<button pButton>\`), set \`component\` to that selector, for example \`button[mat-flat-button]\`: the scan lists such directives under "Attribute directives by usage". Native elements kept on purpose are excluded by class or context: \`button:not(.filter-pill):not(th > *)\`.
7. **Validate and generate.** Run \`npx houserules validate\` and fix what it reports, then \`npx houserules generate\` to update AGENTS.md and the skills. When \`validate\` names an attribute that no directive selects on (an input such as \`iconStart\`), add it to \`nonComponentAttributes\`. When it names groups of native elements kept on purpose (inside \`<th>\`, with one class), confirm with the user and add the \`:not(...)\` it suggests to \`replaces\`. When it reports inline templates, tell the user to pass \`inlineTemplates: true\` to \`configs.recommended()\` unless angular-eslint already extracts them.
8. **Report.** Show the user the final mapping and how money is shown today (the scan summary): it is the list of places to fix.
`;
}

export function renderLearnSkill(): string {
  return `---
name: ${LEARN_SKILL_NAME}
description: Turn corrections of agent-written Angular markup into Houserules config. Use when the user has corrected a screen built by an agent (two commits, a branch, a changelog with both versions) and wants the conventions kept for the next screens.
---

# Learn conventions from corrections

A correction becomes config only when it is a convention of the whole project, not the taste of one screen. Never write the config before the user confirms.

1. **Get both versions.** The agent's version and the corrected one: two commits (\`git diff <before> <after> -- '*.html' '*.scss' '*.ts'\`), a branch, or a document with both. Without both versions, stop and ask.
2. **List the corrections.** One line each: before, after, \`file:line\`. Merge repeated changes into one line with a count.
3. **Sort every correction into one kind:**
   - *Component instead of native or hand-made markup* (\`<button>\` → the button component, a hand-made expand toggle → the library one): a role with \`replaces\`.
   - *A value shown through a component* (plain text → a tag with a tone, \`a → b\` → a before/after view): a role (\`status\`, \`comparison\`, \`money\` or a custom role with \`description\`).
   - *The same inputs added to a component* (a table with gridlines, a small button): the \`usage\` of a role.
   - *A ban not tied to a role* (a pipe, a binding or an attribute the team does not use, such as \`[innerHTML]\`): a \`restrictions\` entry with an ESLint selector over the template AST, a message, \`bad\` taken from the agent's version and \`good\` from the corrected one.
   - *Data and business logic* (fields, requests, error handling): not Houserules, it stays in the code review.
   - *Styles and layout* (spacing, colours, heights): not Houserules; suggest design tokens or the project stylelint.
   - *One screen only* (a filter moved under another one): not a convention, skip it.
   - *A rule that is right in general but not for some files* (a template that renders a document, such as a resume): \`rules: { '<rule>': { ignores: ['<glob>'] } }\`, never an \`eslint-disable\` comment.
4. **Check every candidate against the project, not this diff.** Run \`npx houserules scan --json\` and search the templates. A convention needs evidence outside the corrected screen (the component is used elsewhere, the native element is rare or old code) or an explicit "everywhere" from the user. Note the counts.
5. **Propose a table**: correction → config change → kind → evidence. Mark doubts and ask about them: a library default may not be the team convention.
6. **Write the config after confirmation.** Build \`usage\` from a real call in the project and keep only inputs that are the same for every use. For \`replaces\` use a selector that leaves the library directive alone, for example \`button:not([pButton])\`.
7. **Validate and generate.** Run \`npx houserules validate\`, fix what it reports, then \`npx houserules generate\`. \`validate\` lints every \`bad\` and \`good\` example and shows which elements \`replaces\` reports and which it skips because they carry a directive.
8. **Prove it on the agent's version.** Lint each corrected template as the agent wrote it, for example \`git show <before>:<path> | npx eslint --stdin --stdin-filename <path>\`. Report which corrections the linter now catches, which remain guidance in role descriptions, and which are out of scope.
9. **Report other violations** in the project (\`npx eslint\`) as a separate list. Do not fix them in this task.
`;
}

export function renderSkills(config: HouserulesConfig): GeneratedFile[] {
  return [
    { path: `${SKILLS_DIRECTORY}/${PLAN_SKILL_NAME}/SKILL.md`, content: renderPlanSkill(config) },
    { path: `${SKILLS_DIRECTORY}/${SETUP_SKILL_NAME}/SKILL.md`, content: renderSetupSkill() },
    { path: `${SKILLS_DIRECTORY}/${LEARN_SKILL_NAME}/SKILL.md`, content: renderLearnSkill() },
  ];
}

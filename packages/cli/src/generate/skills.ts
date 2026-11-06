import { BUILT_IN_ROLES } from '../config/roles';
import type { HouserulesConfig } from '../config/schema';

export const SKILLS_DIRECTORY = '.claude/skills';
export const PLAN_SKILL_NAME = 'houserules-plan';
export const SETUP_SKILL_NAME = 'houserules-setup';

export interface GeneratedFile {
  readonly path: string;
  readonly content: string;
}

function roleNames(config: HouserulesConfig): string {
  const names = new Set([...BUILT_IN_ROLES.map((role) => role.name), ...Object.keys(config.roles)]);
  return [...names].join(', ');
}

export function renderPlanSkill(config: HouserulesConfig): string {
  return `---
name: ${PLAN_SKILL_NAME}
description: Plan how a screen shows its data before writing an Angular template. Use before building or changing any screen, card or table that shows backend data.
---

# Plan a screen before writing the template

The roles, components and rules of this project are in the Houserules section of AGENTS.md. Read it first.

1. **Read the data contract.** Open the TypeScript types or the OpenAPI schema of the data the screen shows. Do not plan from field names in the template alone.
2. **Give every shown field a role:** ${roleNames(config)}, or plain text. Write the plan as a short table: field, role, component, tone or units.
3. **Mark doubts instead of guessing.** If you cannot tell whether a number is money or a count, what its sign means, or which currency it has, put a question in the plan and ask the user. A wrong guess (a green debt) is worse than a question.
4. **Check the states.** For async data plan loading, error and empty states.
5. **Write the template** with the components from AGENTS.md, copying their \`usage\` exactly and putting the real expression in place of \`$value\`.
6. **Run ESLint** on the changed templates and fix every \`houserules/*\` error by following its message.

Rules that hold for every role:

- The backend is the only source of truth: do not recalculate values, rewrite messages or parse their text. If the API gives no structure, show the message as is and say so.
- Tone follows the real business state, not the mood of the text.
- Similar screens use the same roles and components, but keep their business differences.
- Restraint: no extra nesting, decoration or icons without meaning.
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
6. **Write the config.** Set \`files\` of a role to the folder of its component, so the component may format its own value. Add \`currencyWords\` if the project writes currencies as words (\`руб.\`, \`USD\`).
7. **Validate and generate.** Run \`npx houserules validate\` and fix what it reports, then \`npx houserules generate\` to update AGENTS.md and the skills.
8. **Report.** Show the user the final mapping and how money is shown today (the scan summary): it is the list of places to fix.
`;
}

export function renderSkills(config: HouserulesConfig): GeneratedFile[] {
  return [
    { path: `${SKILLS_DIRECTORY}/${PLAN_SKILL_NAME}/SKILL.md`, content: renderPlanSkill(config) },
    { path: `${SKILLS_DIRECTORY}/${SETUP_SKILL_NAME}/SKILL.md`, content: renderSetupSkill() },
  ];
}

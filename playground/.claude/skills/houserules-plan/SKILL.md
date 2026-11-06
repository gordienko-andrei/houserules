---
name: houserules-plan
description: Plan how a screen shows its data before writing an Angular template. Use before building or changing any screen, card or table that shows backend data.
---

# Plan a screen before writing the template

The roles, components and rules of this project are in the Houserules section of AGENTS.md. Read it first.

1. **Read the data contract.** Open the TypeScript types or the OpenAPI schema of the data the screen shows. Do not plan from field names in the template alone.
2. **Give every shown field a role:** money, status, metric, issue, comparison, tip, steps, code, action, or plain text. Write the plan as a short table: field, role, component, tone or units.
3. **Mark doubts instead of guessing.** If you cannot tell whether a number is money or a count, what its sign means, or which currency it has, put a question in the plan and ask the user. A wrong guess (a green debt) is worse than a question.
4. **Check the states.** For async data plan loading, error and empty states.
5. **Write the template** with the components from AGENTS.md, copying their `usage` exactly and putting the real expression in place of `$value`.
6. **Run ESLint** on the changed templates and fix every `houserules/*` error by following its message.

Rules that hold for every role:

- The backend is the only source of truth: do not recalculate values, rewrite messages or parse their text. If the API gives no structure, show the message as is and say so.
- Tone follows the real business state, not the mood of the text.
- Similar screens use the same roles and components, but keep their business differences.
- Restraint: no extra nesting, decoration or icons without meaning.

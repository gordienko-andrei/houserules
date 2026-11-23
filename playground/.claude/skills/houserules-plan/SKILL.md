---
name: houserules-plan
description: Plan how a screen shows its data before writing an Angular template. Use before building or changing any screen, card or table that shows backend data.
---

# Plan a screen before writing the template

Run `npx houserules context --list` to see mapped roles and their descriptions.

1. **Read the data contract.** Open the TypeScript types or the OpenAPI schema of the data the screen shows. Do not plan from field names in the template alone.
2. **Give every shown field a role**, or plain text. Run `npx houserules context --roles money,status` with the relevant role names to load their usage and project guidance.
3. **Mark doubts instead of guessing.** If you cannot tell whether a number is money or a count, what its sign means, or which currency it has, put a question in the plan and ask the user. A wrong guess (a green debt) is worse than a question.
4. **Check the states** according to the returned project guidance.
5. **Write the template** with the returned components, copying their `usage` exactly and putting the real expression in place of `$value`.
6. **Run ESLint** on the changed templates and fix every `houserules/*` error by following its message.

Apply the returned project rules and preserve business differences between screens.

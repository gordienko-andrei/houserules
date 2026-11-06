---
name: houserules-setup
description: Set up Houserules for this Angular project, that is map data roles (money, status, metric…) to the project components and pipes in houserules.config.ts. Use when the user asks to set up, configure or update Houserules.
---

# Set up Houserules

You fill `houserules.config.ts`; the user only confirms. Never invent a component or a call.

1. **Collect facts.** Run `npx houserules scan --json`. It lists custom elements and pipes with usage counts and the most common real calls, money candidates and money formatted by hand.
2. **Read the candidates.** Open the code of every candidate component or pipe. Check its inputs, whether it is deprecated, and where it is used.
3. **Propose a mapping with evidence.** For each role give the component or pipe, the number of uses and two or three files, for example: "money → `<app-money>`: 37 templates, `currency` pipe: 12, e.g. src/app/orders/order.html:14".
4. **Build `usage` from a real call.** Take the most common call from the scan and replace the shown expression with `$value`. Keep only what is the same for every value: do not hard-code `currency="RUB"` if amounts come in several currencies.
5. **Ask the user** to confirm the mapping. Ask about every doubt: an old and a new component, a price that may not be money, a pipe that formats more than money. A role with no suitable component stays out of the config, and its rule stays off.
6. **Write the config.** Set `files` of a role to the folder of its component, so the component may format its own value. Add `currencyWords` if the project writes currencies as words (`руб.`, `USD`).
7. **Validate and generate.** Run `npx houserules validate` and fix what it reports, then `npx houserules generate` to update AGENTS.md and the skills.
8. **Report.** Show the user the final mapping and how money is shown today (the scan summary): it is the list of places to fix.

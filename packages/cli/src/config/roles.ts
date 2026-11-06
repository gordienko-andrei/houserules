export interface RoleDefinition {
  readonly name: string;
  readonly description: string;
}

export const BUILT_IN_ROLES: readonly RoleDefinition[] = [
  {
    name: 'money',
    description: 'An amount of money. Currency, rounding, sign and colour are decided by one component or pipe.',
  },
  {
    name: 'status',
    description:
      'A separate tag with a tone (neutral, info, warning, error, success). The tone follows the real business state.',
  },
  {
    name: 'metric',
    description: 'A key number shown on its own (a tile or a labelled value), never inside a sentence.',
  },
  {
    name: 'issue',
    description: 'A structured error card. Errors are grouped by where they happened (row, field).',
  },
  {
    name: 'comparison',
    description: 'Before → after with the exact source values: a fix, a price change, a settings diff.',
  },
  {
    name: 'tip',
    description: 'An inline "how to fix" hint next to the error it belongs to. Shown only if the backend gives it.',
  },
  {
    name: 'steps',
    description: 'A numbered sequence of actions instead of phrases joined with arrows.',
  },
  {
    name: 'code',
    description: 'A monospace block for a formula or diagnostics, with copying.',
  },
  {
    name: 'action',
    description: 'A contextual button next to the data instead of a text link to a related entity.',
  },
];

const BUILT_IN_ROLE_NAMES = new Set(BUILT_IN_ROLES.map((role) => role.name));

export function isBuiltInRole(name: string): boolean {
  return BUILT_IN_ROLE_NAMES.has(name);
}

export function findBuiltInRole(name: string): RoleDefinition | undefined {
  return BUILT_IN_ROLES.find((role) => role.name === name);
}

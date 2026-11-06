import { z } from 'zod';
import { isBuiltInRole } from './roles';

export const VALUE_PLACEHOLDER = '$value';

export const RULE_NAMES = [
  'use-money-component',
  'no-glued-fields',
  'require-async-states',
  'no-px-font-size',
] as const;

export type RuleName = (typeof RULE_NAMES)[number];

const nonEmptyString = z.string().trim().min(1);

const roleMappingSchema = z
  .strictObject({
    component: nonEmptyString.optional().describe('Selector of the component that shows this role.'),
    pipe: nonEmptyString.optional().describe('Name of the pipe that shows this role.'),
    usage: nonEmptyString.describe('A real call to copy, with `$value` in place of the shown expression.'),
    description: nonEmptyString.optional().describe('When to use the role. Required for custom roles.'),
    files: z
      .union([nonEmptyString, z.array(nonEmptyString)])
      .optional()
      .describe('Files of the component itself. Rules of the role do not check them.'),
  })
  .refine((role) => (role.component === undefined) !== (role.pipe === undefined), {
    message: 'Set exactly one of `component` or `pipe`.',
  });

export const configSchema = z
  .strictObject({
    roles: z.record(nonEmptyString, roleMappingSchema).default({}),
    currencyWords: z.array(nonEmptyString).default([]).describe('Currency codes or words, for example `руб.`.'),
    moneyPipes: z.array(nonEmptyString).default(['currency']).describe('Pipes that must not format money.'),
    glossary: nonEmptyString.optional().describe('Domain terms and how to read values, in Markdown.'),
    examples: z.array(nonEmptyString).default([]).describe('Paths to reference components agents should copy.'),
    rules: z.partialRecord(z.enum(RULE_NAMES), z.enum(['off', 'warn', 'error'])).default({}),
  })
  .superRefine((config, context) => {
    for (const [name, role] of Object.entries(config.roles)) {
      if (!isBuiltInRole(name) && role.description === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['roles', name, 'description'],
          message: 'A custom role needs a description of when to use it.',
        });
      }
    }
    const money = config.roles['money'];
    if (money !== undefined && !money.usage.includes(VALUE_PLACEHOLDER)) {
      context.addIssue({
        code: 'custom',
        path: ['roles', 'money', 'usage'],
        message: `The money usage must contain ${VALUE_PLACEHOLDER}.`,
      });
    }
  });

export type HouserulesConfigInput = z.input<typeof configSchema>;
export type HouserulesConfig = z.output<typeof configSchema>;
export type RoleMapping = z.output<typeof roleMappingSchema>;
export type RuleSeverity = 'off' | 'warn' | 'error';

export function defineConfig(config: HouserulesConfigInput): HouserulesConfigInput {
  return config;
}

import { z } from 'zod';
import { parseElementSelector } from './element-selector';
import { isBuiltInRole } from './roles';

export const VALUE_PLACEHOLDER = '$value';

export const DEFAULT_GLUE_SEPARATORS: readonly string[] = ['•', '·', '|', ',', ';'];

export const RULE_NAMES = [
  'use-money-component',
  'no-glued-fields',
  'require-async-states',
  'no-px-font-size',
  'prefer-role-component',
  'restricted-template-syntax',
  'use-format-role',
  'require-empty-state',
  'no-template-arithmetic',
  'no-hardcoded-plural',
] as const;

export type RuleName = (typeof RULE_NAMES)[number];

const nonEmptyString = z.string().trim().min(1);

const elementSelector = nonEmptyString.refine((selector) => parseElementSelector(selector) !== undefined, {
  message:
    'Use a tag with optional attribute or class conditions, for example `ui-money`, `button[pButton]`, `button:not(.link)` or `button:not(th > *)`.',
});

const roleMappingSchema = z
  .strictObject({
    component: elementSelector
      .optional()
      .describe('Selector of the component or directive that shows this role: `ui-money` or `button[pButton]`.'),
    pipe: nonEmptyString.optional().describe('Name of the pipe that shows this role.'),
    usage: nonEmptyString.describe('A real call to copy, with `$value` in place of the shown expression.'),
    description: nonEmptyString.optional().describe('When to use the role. Required for custom roles.'),
    files: z
      .union([nonEmptyString, z.array(nonEmptyString)])
      .optional()
      .describe('Files of the component itself. Rules of the role do not check them.'),
    replaces: z
      .union([elementSelector, z.array(elementSelector).min(1)])
      .optional()
      .describe('Native elements the component is used instead of, for example `button:not([pButton])`.'),
    formats: z
      .array(z.string())
      .min(1)
      .optional()
      .describe("Formats the role pipe may take, without quotes, for example `['d MMM y', 'shortTime']`."),
  })
  .refine((role) => (role.component === undefined) !== (role.pipe === undefined), {
    message: 'Set exactly one of `component` or `pipe`.',
  })
  .refine((role) => role.replaces === undefined || role.component !== undefined, {
    message: '`replaces` needs a `component`: a pipe cannot replace an element.',
    path: ['replaces'],
  })
  .refine((role) => role.formats === undefined || role.pipe !== undefined, {
    message: '`formats` needs a `pipe`: a component decides its format itself.',
    path: ['formats'],
  });

const severitySchema = z.enum(['off', 'warn', 'error']);

const ruleSettingSchema = z.union([
  severitySchema,
  z.strictObject({
    severity: severitySchema.optional().describe('Level of the rule; the preset decides when it is left out.'),
    ignores: z
      .array(nonEmptyString)
      .min(1)
      .describe('Files the rule does not check, for example a template that renders a document such as a resume.'),
  }),
]);

const restrictionSchema = z.strictObject({
  selector: nonEmptyString.describe('An ESLint selector over the template AST, for example `BindingPipe[name="date"]`.'),
  message: nonEmptyString.describe('What to use instead, shown by the linter and to agents.'),
  bad: nonEmptyString.describe('A template the restriction must report.'),
  good: nonEmptyString.describe('A template that must pass every Houserules rule.'),
});

export const configSchema = z
  .strictObject({
    preset: z.enum(['recommended', 'strict']).optional(),
    scan: z.strictObject({ roots: z.array(nonEmptyString).min(1).optional() }).optional(),
    roles: z.record(nonEmptyString, roleMappingSchema).default({}),
    currencyWords: z.array(nonEmptyString).default([]).describe('Currency codes or words, for example `руб.`.'),
    moneyPipes: z.array(nonEmptyString).default(['currency']).describe('Pipes that must not format money.'),
    glueSeparators: z
      .array(nonEmptyString)
      .min(1)
      .optional()
      .describe('Text that glues values when it stands between them, for example `·` or `—`. `,` and `;` are allowed in sentences.'),
    nonComponentAttributes: z
      .array(nonEmptyString)
      .default([])
      .describe('Inputs and helper directives that leave a native element native, for example `iconStart` or `appTooltip`.'),
    glossary: nonEmptyString.optional().describe('Domain terms and how to read values, in Markdown.'),
    examples: z.array(nonEmptyString).default([]).describe('Paths to reference components agents should copy.'),
    restrictions: z.array(restrictionSchema).default([]).describe('Project bans that are not tied to a role, with examples.'),
    rules: z.partialRecord(z.enum(RULE_NAMES), ruleSettingSchema).default({}),
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
export type Restriction = z.output<typeof restrictionSchema>;
export type RuleSeverity = z.output<typeof severitySchema>;
export type RuleSetting = z.output<typeof ruleSettingSchema>;

export function defineConfig(config: HouserulesConfigInput): HouserulesConfigInput {
  return config;
}

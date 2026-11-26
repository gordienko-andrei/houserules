import type { RuleName, RuleSeverity } from './schema';

interface RuleMetadata {
  readonly recommended: RuleSeverity;
  readonly strict: RuleSeverity;
  readonly role?: string;
  readonly summary: string;
}

export const RULE_METADATA: Readonly<Record<RuleName, RuleMetadata>> = {
  'use-money-component': {
    recommended: 'error', strict: 'error', role: 'money',
    summary: 'reports configured money pipes and expressions next to currency markers; use the mapped money component or pipe',
  },
  'no-glued-fields': {
    recommended: 'off', strict: 'error',
    summary: 'reports separate interpolated values joined with separators or arrows, also when the separator is a string inside the expression',
  },
  'require-async-states': {
    recommended: 'warn', strict: 'error',
    summary: 'checks value(), isLoading(), error() and status() of the resources the component declares, in one template; status() is treated as handling both loading and error',
  },
  'no-px-font-size': {
    recommended: 'error', strict: 'error',
    summary: 'reports fixed px font sizes in template styles and Tailwind classes such as text-[12px]',
  },
  'prefer-role-component': {
    recommended: 'warn', strict: 'error',
    summary: 'reports native elements listed in `replaces` of a role; use the role component instead',
  },
  'restricted-template-syntax': {
    recommended: 'error', strict: 'error',
    summary: 'reports template nodes matched by the project `restrictions`; each message says what to use instead',
  },
};

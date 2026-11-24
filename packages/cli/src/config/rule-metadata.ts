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
    summary: 'reports separate interpolated values joined with separators or arrows',
  },
  'require-async-states': {
    recommended: 'warn', strict: 'error',
    summary: 'checks resource value(), isLoading(), error() and status() calls in one template; status() is treated as handling both loading and error',
  },
  'no-px-font-size': {
    recommended: 'error', strict: 'error',
    summary: 'reports fixed px font sizes in template styles',
  },
};

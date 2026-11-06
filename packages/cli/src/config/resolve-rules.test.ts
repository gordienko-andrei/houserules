import { describe, expect, it } from 'vitest';
import { parseConfig } from './load-config';
import { resolveRules } from './resolve-rules';

function ruleNames(input: unknown): string[] {
  return resolveRules(parseConfig(input)).map((rule) => rule.name);
}

describe('resolveRules', () => {
  it('turns off the money rule when no money role is mapped', () => {
    expect(ruleNames({})).toEqual(['no-glued-fields', 'require-async-states', 'no-px-font-size']);
  });

  it('passes the money component, usage and currency settings to the money rule', () => {
    const [money] = resolveRules(
      parseConfig({
        roles: {
          money: { component: 'ui-money', usage: '<ui-money [value]="$value" />', files: 'src/app/ui/money/**' },
        },
        currencyWords: ['руб.'],
      }),
    );
    expect(money).toEqual({
      name: 'use-money-component',
      severity: 'error',
      options: {
        component: 'ui-money',
        usage: '<ui-money [value]="$value" />',
        pipes: ['currency'],
        currencyWords: ['руб.'],
      },
      ignoredFiles: ['src/app/ui/money/**'],
    });
  });

  it('passes a money pipe instead of a component', () => {
    const [money] = resolveRules(parseConfig({ roles: { money: { pipe: 'tuiAmount', usage: '{{ $value | tuiAmount }}' } } }));
    expect(money?.options).toMatchObject({ pipe: 'tuiAmount' });
    expect(money?.options).not.toHaveProperty('component');
  });

  it('passes metric, comparison and steps usages to no-glued-fields', () => {
    const rules = resolveRules(
      parseConfig({
        roles: {
          metric: { component: 'ui-metric', usage: '<ui-metric [label]="label" [value]="$value" />' },
          status: { component: 'ui-badge', usage: '<ui-badge>{{ $value }}</ui-badge>' },
        },
      }),
    );
    expect(rules.find((rule) => rule.name === 'no-glued-fields')?.options).toEqual({
      usages: { metric: '<ui-metric [label]="label" [value]="$value" />' },
    });
  });

  it('applies severity overrides and drops rules turned off', () => {
    const rules = resolveRules(parseConfig({ rules: { 'no-glued-fields': 'warn', 'no-px-font-size': 'off' } }));
    expect(rules.map((rule) => [rule.name, rule.severity])).toEqual([
      ['no-glued-fields', 'warn'],
      ['require-async-states', 'error'],
    ]);
  });
});

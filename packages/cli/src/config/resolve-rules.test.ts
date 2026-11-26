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

  it('turns on prefer-role-component only for roles with replaces', () => {
    expect(ruleNames({ roles: { action: { component: 'p-button', usage: '<p-button />' } } })).not.toContain('prefer-role-component');
    const rules = resolveRules(
      parseConfig({
        preset: 'recommended',
        roles: {
          action: { component: 'p-button', usage: '<p-button [label]="$value" />', replaces: 'button:not([pButton])', files: 'src/ui/button/**' },
          toggle: { component: 'p-checkbox', usage: '<p-checkbox [binary]="true" />', replaces: ['input[type=checkbox]'], description: 'A boolean choice' },
        },
      }),
    );
    expect(rules.find((rule) => rule.name === 'prefer-role-component')).toEqual({
      name: 'prefer-role-component',
      severity: 'warn',
      options: {
        replacements: [
          { role: 'action', selector: 'button:not([pButton])', component: 'p-button', usage: '<p-button [label]="$value" />' },
          { role: 'toggle', selector: 'input[type=checkbox]', component: 'p-checkbox', usage: '<p-checkbox [binary]="true" />' },
        ],
      },
      ignoredFiles: ['src/ui/button/**'],
    });
  });

  it('passes restriction selectors and messages without the examples', () => {
    expect(ruleNames({})).not.toContain('restricted-template-syntax');
    const rules = resolveRules(
      parseConfig({ restrictions: [{ selector: 'BindingPipe[name="date"]', message: 'Use <app-date>.', bad: '{{ d | date }}', good: '<app-date />' }] }),
    );
    expect(rules.find((rule) => rule.name === 'restricted-template-syntax')).toEqual({
      name: 'restricted-template-syntax',
      severity: 'error',
      options: { restrictions: [{ selector: 'BindingPipe[name="date"]', message: 'Use <app-date>.' }] },
      ignoredFiles: [],
    });
  });

  it('applies severity overrides and drops rules turned off', () => {
    const rules = resolveRules(parseConfig({ rules: { 'no-glued-fields': 'warn', 'no-px-font-size': 'off' } }));
    expect(rules.map((rule) => [rule.name, rule.severity])).toEqual([
      ['no-glued-fields', 'warn'],
      ['require-async-states', 'error'],
    ]);
  });

  it('excludes files from one rule and keeps the preset level when only ignores are set', () => {
    const rules = resolveRules(
      parseConfig({ preset: 'strict', rules: { 'no-glued-fields': { ignores: ['**/resume-preview*'] }, 'no-px-font-size': { severity: 'warn', ignores: ['**/print/**'] } } }),
    );
    expect(rules.find((rule) => rule.name === 'no-glued-fields')).toMatchObject({ severity: 'error', ignoredFiles: ['**/resume-preview*'] });
    expect(rules.find((rule) => rule.name === 'no-px-font-size')).toMatchObject({ severity: 'warn', ignoredFiles: ['**/print/**'] });
  });

  it('passes glue separators and attributes that leave elements native', () => {
    const rules = resolveRules(
      parseConfig({
        glueSeparators: ['·', '—'],
        nonComponentAttributes: ['iconStart'],
        roles: { action: { component: 'button[tuiButton]', usage: '<button tuiButton>{{ $value }}</button>', replaces: 'button' } },
      }),
    );
    expect(rules.find((rule) => rule.name === 'no-glued-fields')?.options).toEqual({ separators: ['·', '—'] });
    expect(rules.find((rule) => rule.name === 'prefer-role-component')?.options).toMatchObject({ nonComponentAttributes: ['iconStart'] });
  });
});

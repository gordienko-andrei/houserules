import { describe, expect, it } from 'vitest';
import { ConfigError, parseConfig } from './load-config';

describe('parseConfig', () => {
  it('fills defaults for an empty config', () => {
    expect(parseConfig({})).toEqual({
      roles: {},
      currencyWords: [],
      moneyPipes: ['currency'],
      nonComponentAttributes: [],
      examples: [],
      restrictions: [],
      rules: {},
    });
  });

  it('accepts a role mapped to a component or to a pipe', () => {
    const config = parseConfig({
      roles: {
        money: { pipe: 'tuiAmount', usage: '{{ $value | tuiAmount: "RUB" }}' },
        status: { component: 'ui-badge', usage: '<ui-badge [tone]="tone">{{ label }}</ui-badge>' },
      },
    });
    expect(Object.keys(config.roles)).toEqual(['money', 'status']);
  });

  it('rejects a role with both or neither component and pipe', () => {
    expect(() => parseConfig({ roles: { money: { component: 'a', pipe: 'b', usage: '$value' } } })).toThrow(
      /roles\.money: Set exactly one of `component` or `pipe`/,
    );
    expect(() => parseConfig({ roles: { status: { usage: '<x />' } } })).toThrow(ConfigError);
  });

  it('requires $value in the money usage', () => {
    expect(() => parseConfig({ roles: { money: { component: 'ui-money', usage: '<ui-money />' } } })).toThrow(
      /roles\.money\.usage/,
    );
  });

  it('requires a description for a custom role', () => {
    expect(() => parseConfig({ roles: { rating: { component: 'ui-stars', usage: '<ui-stars />' } } })).toThrow(
      /roles\.rating\.description/,
    );
    const config = parseConfig({
      roles: { rating: { component: 'ui-stars', usage: '<ui-stars />', description: 'Product rating' } },
    });
    expect(config.roles['rating']?.description).toBe('Product rating');
  });

  it('accepts native elements a role component replaces', () => {
    const config = parseConfig({
      roles: {
        action: { component: 'p-button', usage: '<p-button [label]="$value" />', replaces: ['button:not([pButton])'] },
      },
    });
    expect(config.roles['action']?.replaces).toEqual(['button:not([pButton])']);
  });

  it('accepts a directive selector as the role component', () => {
    const config = parseConfig({
      roles: { action: { component: 'button[mat-flat-button]', usage: '<button mat-flat-button>{{ $value }}</button>' } },
    });
    expect(config.roles['action']?.component).toBe('button[mat-flat-button]');
    expect(() => parseConfig({ roles: { action: { component: 'button:hover', usage: '<x />' } } })).toThrow(/roles\.action\.component/);
  });

  it('rejects unsupported selectors and replaces on a pipe role', () => {
    expect(() =>
      parseConfig({ roles: { action: { component: 'p-button', usage: '<p-button />', replaces: 'div > button' } } }),
    ).toThrow(/roles\.action\.replaces/);
    expect(() =>
      parseConfig({ roles: { money: { pipe: 'amount', usage: '{{ $value | amount }}', replaces: 'span' } } }),
    ).toThrow(/roles\.money\.replaces: `replaces` needs a `component`/);
  });

  it('accepts restrictions with a selector, a message and both examples', () => {
    const restriction = { selector: 'BindingPipe[name="date"]', message: 'Use <app-date>.', bad: '{{ d | date }}', good: '<app-date [value]="d" />' };
    expect(parseConfig({ restrictions: [restriction] }).restrictions).toEqual([restriction]);
    expect(() => parseConfig({ restrictions: [{ selector: 'BindingPipe', message: 'x', bad: '{{ d | date }}' }] })).toThrow(/restrictions\.0\.good/);
  });

  it('accepts formats only for a role shown with a pipe', () => {
    const date = { pipe: 'date', usage: "{{ $value | date: 'd MMM y' }}", formats: ['d MMM y', 'shortTime'] };
    expect(parseConfig({ roles: { date } }).roles['date']?.formats).toEqual(['d MMM y', 'shortTime']);
    expect(() => parseConfig({ roles: { date: { component: 'app-date', usage: '<app-date [value]="$value" />', formats: ['d MMM'] } } })).toThrow(
      /roles\.date\.formats: `formats` needs a `pipe`/,
    );
  });

  it('rejects unknown keys and unknown rules', () => {
    expect(() => parseConfig({ colours: {} })).toThrow(ConfigError);
    expect(() => parseConfig({ rules: { 'no-such-rule': 'off' } })).toThrow(ConfigError);
  });
});

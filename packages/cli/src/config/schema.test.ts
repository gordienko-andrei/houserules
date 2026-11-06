import { describe, expect, it } from 'vitest';
import { ConfigError, parseConfig } from './load-config';

describe('parseConfig', () => {
  it('fills defaults for an empty config', () => {
    expect(parseConfig({})).toEqual({
      roles: {},
      currencyWords: [],
      moneyPipes: ['currency'],
      examples: [],
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

  it('rejects unknown keys and unknown rules', () => {
    expect(() => parseConfig({ colours: {} })).toThrow(ConfigError);
    expect(() => parseConfig({ rules: { 'no-such-rule': 'off' } })).toThrow(ConfigError);
  });
});

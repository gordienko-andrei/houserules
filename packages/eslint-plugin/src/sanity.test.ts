import { describe, expect, it } from 'vitest';
import plugin from './index';

describe('eslint-plugin-houserules', () => {
  it('exposes plugin meta and rules', () => {
    expect(plugin.meta.name).toBe('eslint-plugin-houserules');
    expect(plugin.rules).toEqual({});
  });
});

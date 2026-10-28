import { describe, expect, it } from 'vitest';
import { name } from './index';

describe('houserules cli', () => {
  it('exposes package name', () => {
    expect(name).toBe('houserules');
  });
});

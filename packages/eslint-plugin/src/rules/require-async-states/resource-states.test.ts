import { describe, expect, it } from 'vitest';
import { EMPTY_RESOURCE_STATES, describeMissingStates, missingStates, withStateMethod } from './resource-states';

describe('missingStates', () => {
  it('requires loading and error for every resource', () => {
    expect(missingStates(EMPTY_RESOURCE_STATES)).toEqual(['loading', 'error']);
  });

  it('marks states handled by resource methods', () => {
    const states = withStateMethod(withStateMethod(EMPTY_RESOURCE_STATES, 'isLoading'), 'error');
    expect(missingStates(states)).toEqual([]);
    expect(missingStates(withStateMethod(EMPTY_RESOURCE_STATES, 'status'))).toEqual([]);
  });

  it('requires the empty state only for an iterated value without a length check', () => {
    const handled = withStateMethod(EMPTY_RESOURCE_STATES, 'status');
    expect(missingStates({ ...handled, isIteratedWithoutEmpty: true })).toEqual(['empty']);
    expect(missingStates({ ...handled, isIteratedWithoutEmpty: true, isLengthChecked: true })).toEqual([]);
  });
});

describe('describeMissingStates', () => {
  it('lists the states and the branches to add', () => {
    expect(describeMissingStates('orders', ['loading', 'empty'])).toEqual({
      states: 'loading, empty',
      hints: '`@if (orders.isLoading())`, an `@empty` block in `@for`',
    });
  });
});

export type AsyncState = 'loading' | 'error' | 'empty';

export interface ResourceStates {
  readonly handlesLoading: boolean;
  readonly handlesError: boolean;
  readonly isIteratedWithoutEmpty: boolean;
  readonly isLengthChecked: boolean;
}

export const EMPTY_RESOURCE_STATES: ResourceStates = {
  handlesLoading: false,
  handlesError: false,
  isIteratedWithoutEmpty: false,
  isLengthChecked: false,
};

const STATE_METHODS: Readonly<Record<string, Partial<ResourceStates>>> = {
  isLoading: { handlesLoading: true },
  error: { handlesError: true },
  status: { handlesLoading: true, handlesError: true },
};

export function isStateMethod(method: string): boolean {
  return method in STATE_METHODS;
}

export function withStateMethod(states: ResourceStates, method: string): ResourceStates {
  return { ...states, ...STATE_METHODS[method] };
}

export function missingStates(states: ResourceStates): AsyncState[] {
  const missing: AsyncState[] = [];
  if (!states.handlesLoading) {
    missing.push('loading');
  }
  if (!states.handlesError) {
    missing.push('error');
  }
  if (states.isIteratedWithoutEmpty && !states.isLengthChecked) {
    missing.push('empty');
  }
  return missing;
}

function stateHint(resource: string, state: AsyncState): string {
  switch (state) {
    case 'loading':
      return `\`@if (${resource}.isLoading())\``;
    case 'error':
      return `\`@if (${resource}.error())\``;
    case 'empty':
      return 'an `@empty` block in `@for`';
  }
}

export function describeMissingStates(resource: string, states: readonly AsyncState[]): { states: string; hints: string } {
  return {
    states: states.join(', '),
    hints: states.map((state) => stateHint(resource, state)).join(', '),
  };
}

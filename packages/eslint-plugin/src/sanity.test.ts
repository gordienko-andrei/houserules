import * as templateParser from '@angular-eslint/template-parser';
import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import houserules, { plugin } from './index';

describe('eslint-plugin-houserules', () => {
  it('exposes plugin meta and rules', () => {
    expect(plugin.meta.name).toBe('eslint-plugin-houserules');
    expect(Object.keys(plugin.rules)).toEqual([
      'use-money-component',
      'no-glued-fields',
      'require-async-states',
      'no-px-font-size',
    ]);
    expect(houserules.rules).toBe(plugin.rules);
  });

  it('reports money rendered without the project component through a flat config', () => {
    const linter = new Linter({ configType: 'flat' });
    const config: Linter.Config[] = [
      {
        files: ['**/*.html'],
        languageOptions: { parser: templateParser },
        plugins: { houserules: plugin },
        rules: { 'houserules/use-money-component': ['error', { component: 'ui-money' }] },
      },
    ];

    const messages = linter.verify('<p>{{ total | currency }}</p>', config, 'order.component.html');

    expect(messages.map(({ ruleId, message }) => ({ ruleId, message }))).toEqual([
      {
        ruleId: 'houserules/use-money-component',
        message: 'Show money with <ui-money> instead of the `currency` pipe.',
      },
    ]);
  });
});

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Linter } from 'eslint';
import { afterEach, describe, expect, it, vi } from 'vitest';
import houserules from '../index';
import { RULE_METADATA } from '@andrewgordienko/houserules';

const MONEY_ROLE = {
  component: 'ui-money',
  usage: '<ui-money [value]="$value" />',
  files: 'src/app/ui/money/**',
};

function lint(code: string, configs: Linter.Config[], fileName = 'src/app/order.component.html'): string[] {
  return new Linter({ configType: 'flat' })
    .verify(code, configs, fileName)
    .map((message) => `${message.ruleId}: ${message.message}`);
}

describe('configs.recommended', () => {
  it('has shared metadata for every exported rule', () => {
    expect(Object.keys(RULE_METADATA).sort()).toEqual(Object.keys(houserules.rules).sort());
  });
  const directories: string[] = [];

  afterEach(() => {
    directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
  });

  it('turns the money rule on only when the money role is mapped', () => {
    const withoutMoney = houserules.configs.recommended({ config: {} });
    expect(lint('<p>{{ total | currency }}</p>', withoutMoney)).toEqual([]);

    const withMoney = houserules.configs.recommended({ config: { roles: { money: MONEY_ROLE } } });
    expect(lint('<p>{{ order.total | currency }}</p>', withMoney)).toEqual([
      'houserules/use-money-component: Show `order.total` with `<ui-money [value]="order.total" />` instead of the `currency` pipe.',
    ]);
  });

  it('does not check the files of the role component itself', () => {
    const configs = houserules.configs.recommended({ config: { roles: { money: MONEY_ROLE } } });
    expect(lint('<span>{{ value | currency }}</span>', configs, 'src/app/ui/money/money.component.html')).toEqual([]);
  });

  it('enables rules that need no component in any project', () => {
    const configs = houserules.configs.recommended({ config: {} });
    expect(lint('<p style="font-size: 12px">{{ a }} • {{ b }}</p>', configs)).toEqual([
      'houserules/no-px-font-size: Font size is set in fixed `px`. Use `rem` or a typography class of the project, so text scales up to 200% (WCAG 1.4.4).',
      'houserules/no-glued-fields: Values are glued into one text with `•`. Lines glued with separators are a typical sign of generated markup and are not allowed, metadata lines included. Put each value in its own element, space them with layout (`gap`) and mute the secondary ones. See https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/no-glued-fields.md',
    ]);
  });

  it('reports native elements a role replaces, except in the files of the role component', () => {
    const configs = houserules.configs.recommended({
      config: {
        roles: {
          action: { component: 'p-button', usage: '<p-button [label]="$value" />', replaces: 'button:not([pButton])', files: 'src/app/ui/button/**' },
        },
      },
    });
    const template = '<button type="button">Retry</button><button pButton>Save</button>';
    expect(lint(template, configs)).toEqual([
      'houserules/prefer-role-component: Native `<button>` matches `button:not([pButton])`, which the `action` role replaces. Use <p-button> as in `<p-button [label]="$value" />`. See https://github.com/gordienko-andrei/houserules/blob/main/packages/eslint-plugin/docs/rules/prefer-role-component.md',
    ]);
    expect(lint(template, configs, 'src/app/ui/button/button.component.html')).toEqual([]);
  });

  it('applies severities from the config', () => {
    const configs = houserules.configs.recommended({ config: { rules: { 'no-px-font-size': 'off' } } });
    expect(lint('<p style="font-size: 12px">a</p>', configs)).toEqual([]);
  });

  it('applies recommended defaults and explicit overrides', () => {
    const recommended = houserules.configs.recommended({ config: { preset: 'recommended' } });
    const template = '<p>{{ a }} • {{ b }}</p>';
    expect(lint(template, recommended)).toEqual([]);
    const overridden = houserules.configs.recommended({
      config: { preset: 'recommended', rules: { 'no-glued-fields': 'warn' } },
    });
    const messages = new Linter({ configType: 'flat' }).verify(template, overridden, 'src/app/test.html');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.severity).toBe(1);
  });

  it('checks inline templates of components when asked', () => {
    const stubParser = {
      parseForESLint: () => ({
        ast: { type: 'Program', body: [], sourceType: 'module', range: [0, 0], loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } }, tokens: [], comments: [] },
      }),
    };
    const configs: Linter.Config[] = [
      { files: ['**/*.ts'], languageOptions: { parser: stubParser } },
      ...houserules.configs.recommended({ config: {}, inlineTemplates: true }),
    ];
    const source = [
      "import { Component } from '@angular/core';",
      '@Component({',
      "  selector: 'app-x',",
      '  template: `<p>',
      '    {{ a }} · {{ b }}</p>`,',
      '})',
      'export class X {}',
    ].join('\n');
    // The ESLint CLI lints every block a config matches; the Linter API lints only `.js` blocks unless told otherwise.
    const messages = new Linter({ configType: 'flat' }).verify(source, configs, { filename: 'src/app/x.component.ts', filterCodeBlock: () => true });
    expect(messages.map((message) => [message.ruleId, message.line, message.column])).toEqual([['houserules/no-glued-fields', 5, 13]]);
    expect(houserules.configs.recommended({ config: {} }).some((config) => config.processor !== undefined)).toBe(false);
  });

  it('leaves the rules out with a warning when there is no config', () => {
    const directory = mkdtempSync(join(tmpdir(), 'houserules-eslint-'));
    directories.push(directory);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(houserules.configs.recommended({ cwd: directory })).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('loads houserules.config.ts from the given directory', () => {
    const directory = mkdtempSync(join(tmpdir(), 'houserules-eslint-'));
    directories.push(directory);
    writeFileSync(
      join(directory, 'houserules.config.ts'),
      `export default { roles: { money: { pipe: 'tuiAmount', usage: '{{ $value | tuiAmount }}' } } };\n`,
    );
    const configs = houserules.configs.recommended({ cwd: directory });
    expect(lint('<p>{{ order.total }} ₽</p>', configs)).toEqual([
      'houserules/use-money-component: Show `order.total` with `{{ order.total | tuiAmount }}` instead of formatting it by hand next to a currency sign or code.',
    ]);
  });
});

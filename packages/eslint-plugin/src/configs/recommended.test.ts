import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Linter } from 'eslint';
import { afterEach, describe, expect, it } from 'vitest';
import houserules from '../index';

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
      'houserules/no-glued-fields: Values are glued into one text with `•`. Show each value in its own element.',
    ]);
  });

  it('applies severities from the config', () => {
    const configs = houserules.configs.recommended({ config: { rules: { 'no-px-font-size': 'off' } } });
    expect(lint('<p style="font-size: 12px">a</p>', configs)).toEqual([]);
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
      'houserules/use-money-component: Show `order.total` with `{{ order.total | tuiAmount }}` instead of formatting it by hand next to a currency sign.',
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { collectDeclarations, elementNamesOf } from './declarations';

const SOURCE = `
import { Component, Input, Pipe, input, model } from '@angular/core';

/** @deprecated Use MoneyComponent. */
@Component({ selector: 'app-old-money, [appOldMoney]', templateUrl: './old-money.html' })
export class OldMoneyComponent {
  @Input() amount = 0;
}

@Component({
  selector: 'app-money',
  template: \`<span>{{ value() }}</span>\`,
})
export class MoneyComponent {
  readonly value = input.required<number>();
  readonly currency = input('RUB');
  readonly open = model(false);
  readonly internal = 1;
}

@Pipe({ name: 'amount' })
export class AmountPipe {}
`;

describe('collectDeclarations', () => {
  const declarations = collectDeclarations('src/money.ts', SOURCE);

  it('finds components with selectors, inputs and deprecation', () => {
    expect(declarations.components).toEqual([
      {
        selector: 'app-old-money, [appOldMoney]',
        elementNames: ['app-old-money'],
        className: 'OldMoneyComponent',
        file: 'src/money.ts',
        inputs: ['amount'],
        isDeprecated: true,
      },
      {
        selector: 'app-money',
        elementNames: ['app-money'],
        className: 'MoneyComponent',
        file: 'src/money.ts',
        inputs: ['value', 'currency', 'open'],
        isDeprecated: false,
      },
    ]);
  });

  it('finds pipes', () => {
    expect(declarations.pipes).toEqual([{ name: 'amount', className: 'AmountPipe', file: 'src/money.ts', isDeprecated: false }]);
  });

  it('extracts inline templates with their first line', () => {
    expect(declarations.inlineTemplates).toEqual([{ file: 'src/money.ts', text: '<span>{{ value() }}</span>', firstLine: 12 }]);
  });
});

describe('elementNamesOf', () => {
  it('keeps only element selectors', () => {
    expect(elementNamesOf('tui-amount, [tuiAmount], button[appButton], .x')).toEqual(['tui-amount']);
  });
});

import { describe, expect, it } from 'vitest';
import { renderUsage } from './usage';

describe('renderUsage', () => {
  it('puts the expression in place of $value', () => {
    expect(renderUsage('<ui-money [value]="$value" />', 'order.total')).toBe(
      '<ui-money [value]="order.total" />',
    );
  });

  it('works with a pipe usage', () => {
    expect(renderUsage('{{ $value | tuiAmount: "RUB" }}', 'order.total')).toBe(
      '{{ order.total | tuiAmount: "RUB" }}',
    );
  });

  it('replaces every placeholder', () => {
    expect(renderUsage('<x [value]="$value" [title]="$value" />', 'a')).toBe(
      '<x [value]="a" [title]="a" />',
    );
  });

  it('collapses whitespace of a multi-line expression', () => {
    expect(renderUsage('<x [value]="$value" />', '\n  order\n    .total  ')).toBe(
      '<x [value]="order .total" />',
    );
  });

  it('keeps replacement patterns of String.replace literal', () => {
    expect(renderUsage('<x [value]="$value" />', "price$ ?? $&")).toBe('<x [value]="price$ ?? $&" />');
  });

  it('gives up when the expression would break the quotes of the usage', () => {
    expect(renderUsage('<x [value]="$value" />', 'kind === "debt" ? debt : 0')).toBeUndefined();
    expect(renderUsage("{{ $value | money: 'RUB' }}", "rates['RUB']")).toBeUndefined();
  });

  it('allows quotes the usage does not use', () => {
    expect(renderUsage('<x [value]="$value" />', "rates['RUB']")).toBe('<x [value]="rates[\'RUB\']" />');
  });

  it('gives up without a placeholder or an expression', () => {
    expect(renderUsage('<ui-money />', 'total')).toBeUndefined();
    expect(renderUsage('<x [value]="$value" />', '   ')).toBeUndefined();
  });
});

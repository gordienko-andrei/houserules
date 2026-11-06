import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'ui-money',
  imports: [CurrencyPipe],
  templateUrl: './money.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoneyComponent {
  readonly value = input.required<number>();
  readonly currency = input('RUB');
}

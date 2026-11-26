import { ChangeDetectionStrategy, Component, resource } from '@angular/core';

@Component({
  selector: 'app-orders-list-good',
  templateUrl: './orders-list.good.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersListGoodComponent {
  readonly orders = resource({ loader: () => fetch('/api/orders').then((response) => response.json()) });
}

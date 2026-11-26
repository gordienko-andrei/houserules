import { ChangeDetectionStrategy, Component, resource } from '@angular/core';

@Component({
  selector: 'app-orders-list-bad',
  templateUrl: './orders-list.bad.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersListBadComponent {
  readonly orders = resource({ loader: () => fetch('/api/orders').then((response) => response.json()) });
}

import { Component, input, resource, signal } from '@angular/core';
import type { ResourceRef } from '@angular/core';
import { form } from '@angular/forms/signals';

@Component({ selector: 'app-orders-page', templateUrl: './orders-page.component.html' })
export class OrdersPage {
  readonly orders = resource({ loader: () => Promise.resolve([]) });
  readonly profile = input.required<ResourceRef<{ name: string }>>();
  readonly slider = signal(0);
  readonly form = form(signal({ email: '' }));
}

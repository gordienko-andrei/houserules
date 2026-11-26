import { Component, resource } from '@angular/core';
import type { ResourceRef } from '@angular/core';

@Component({ selector: 'app-async-cases', templateUrl: './async-cases.component.html' })
export class AsyncCases {
  readonly orders = resource({ loader: () => Promise.resolve([]) });
  readonly profile = resource({ loader: () => Promise.resolve({ name: '' }) });
  readonly a = resource({ loader: () => Promise.resolve(1) });
  readonly b = resource({ loader: () => Promise.resolve(2) });
  readonly page!: { readonly orders: ResourceRef<{ id: number }[]> };
}

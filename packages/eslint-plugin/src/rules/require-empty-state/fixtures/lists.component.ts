import { Component, input, resource, signal } from '@angular/core';

const TABS = ['all', 'open'] as const;

@Component({ selector: 'app-lists', templateUrl: './lists.component.html' })
export class Lists {
  readonly orders = signal<{ id: number; lines: string[] }[]>([]);
  readonly tags = input<string[]>([]);
  readonly tabs = TABS;
  readonly sizes = ['s', 'm'] as const;
  readonly labels = { a: 'A' };
  readonly invoices = resource({ loader: () => Promise.resolve([]) });
}

import { Component } from '@angular/core';

@Component({ selector: 'app-legacy', templateUrl: './legacy.html' })
export class Legacy {
  readonly orders = apiResource('/orders');
}

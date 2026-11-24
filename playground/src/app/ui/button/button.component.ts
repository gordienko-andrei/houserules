import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'ui-button',
  templateUrl: './button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly pressed = output<void>();
}

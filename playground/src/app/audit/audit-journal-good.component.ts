import { ChangeDetectionStrategy, Component, resource } from '@angular/core';

@Component({
  selector: 'app-audit-journal-good',
  templateUrl: './audit-journal.good.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditJournalGoodComponent {
  readonly events = resource({ loader: () => fetch('/api/audit').then((response) => response.json()) });
}

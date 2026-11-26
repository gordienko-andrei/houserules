import { ChangeDetectionStrategy, Component, resource } from '@angular/core';

@Component({
  selector: 'app-audit-journal-bad',
  templateUrl: './audit-journal.bad.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditJournalBadComponent {
  readonly events = resource({ loader: () => fetch('/api/audit').then((response) => response.json()) });
}

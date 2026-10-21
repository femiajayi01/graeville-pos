import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { ConfirmService } from '@core/services/confirm.service';
import { I18NextPipe } from 'angular-i18next';

/** Renders the dialog requested through ConfirmService.ask(). */
@Component({
  selector: 'app-confirm-dialog',
  imports: [ClarityModule, I18NextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.pending(); as dialog) {
      <clr-modal
        [clrModalOpen]="true"
        (clrModalOpenChange)="confirm.close(false)"
        clrModalSize="sm"
      >
        <h3 class="modal-title">{{ dialog.title }}</h3>
        <div class="modal-body">
          <p>{{ dialog.message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" (click)="confirm.close(false)">
            {{ 'common.cancel' | i18next }}
          </button>
          <button
            type="button"
            class="btn"
            [class.btn-danger]="dialog.danger"
            [class.btn-primary]="!dialog.danger"
            (click)="confirm.close(true)"
          >
            {{ dialog.confirmLabel ?? ('common.confirm' | i18next) }}
          </button>
        </div>
      </clr-modal>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
}

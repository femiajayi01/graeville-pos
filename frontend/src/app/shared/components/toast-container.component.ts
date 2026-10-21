import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { ToastService } from '@core/services/toast.service';

/** Stack of Clarity alerts in the top-right corner. */
@Component({
  selector: 'app-toast-container',
  imports: [ClarityModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <clr-alert
          [clrAlertType]="toast.type"
          [clrAlertClosable]="true"
          (clrAlertClosedChange)="toastService.dismiss(toast.id)"
        >
          <clr-alert-item>
            <span class="alert-text">{{ toast.message }}</span>
          </clr-alert-item>
        </clr-alert>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      top: 4.2rem;
      right: 1rem;
      z-index: 1100;
      width: min(420px, calc(100vw - 2rem));
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .toast-stack clr-alert {
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      background: var(--cds-alias-object-container-background, #fff);
    }
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}

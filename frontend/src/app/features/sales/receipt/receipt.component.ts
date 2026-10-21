import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { Order } from '@core/models';
import { ConfirmService } from '@core/services/confirm.service';
import { SalesService } from '@core/services/sales.service';
import { StoreInfoService } from '@core/services/store-info.service';
import { ToastService } from '@core/services/toast.service';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { errorMessage } from '@shared/utils/http-error.util';
import { DatePipe } from '@angular/common';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

/**
 * Receipt view (Laravel: orders/print, re-print, printout, mail_receipt and return pages, merged into one).
 * `?print=1` opens the print dialog automatically after a sale.
 */
@Component({
  selector: 'app-receipt',
  imports: [ClarityModule, FormsModule, RouterLink, DatePipe, I18NextPipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.scss',
})
export class ReceiptComponent {
  /** Route params (withComponentInputBinding). */
  readonly id = input.required<string>();
  readonly print = input<string>();

  readonly auth = inject(AuthService);
  readonly store = inject(StoreInfoService);
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly order = signal<Order | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly emailOpen = signal(false);
  readonly sending = signal(false);
  readonly returning = signal(false);
  emailTo = '';

  readonly canReturn = computed(
    () => this.auth.isManager() && !!this.order() && !this.order()!.isReturned,
  );

  constructor() {
    this.store.load();
    effect(() => {
      const id = Number(this.id());
      this.sales.get(id).subscribe({
        next: (order) => {
          this.order.set(order);
          this.emailTo = order.customer?.email ?? '';
          if (this.print()) {
            setTimeout(() => window.print(), 300);
            void this.router.navigate([], { queryParams: {}, replaceUrl: true });
          }
        },
        error: (err) => this.loadError.set(errorMessage(err)),
      });
    });
  }

  doPrint(): void {
    window.print();
  }

  sendEmail(): void {
    const order = this.order();
    if (!order || !this.emailTo.trim()) return;
    this.sending.set(true);
    this.sales.emailReceipt(order.id, this.emailTo.trim()).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.sending.set(false);
        this.emailOpen.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.sending.set(false);
      },
    });
  }

  /** Full return: all items go back into stock (Laravel: postReturn with "all"). */
  async returnOrder(): Promise<void> {
    const order = this.order();
    if (!order) return;
    const ok = await this.confirm.ask({
      title: this.i18n.t('receipt.returnTitle') as string,
      message: this.i18n.t('receipt.returnMessage', { number: order.orderNumber }) as string,
      confirmLabel: this.i18n.t('receipt.returnItems') as string,
      danger: true,
    });
    if (!ok) return;
    this.returning.set(true);
    this.sales.returnOrder(order.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.returning.set(false);
        this.toast.success(this.i18n.t('receipt.returned') as string);
      },
      error: (err) => {
        this.returning.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }
}

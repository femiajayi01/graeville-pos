import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { Packing } from '@core/models';
import { ConfirmService } from '@core/services/confirm.service';
import { SalesService } from '@core/services/sales.service';
import { TerminalService } from '@core/services/terminal.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';
import { CartStore } from '../cart.store';

/** Parked sales on this till (Laravel: packing/index, packing/unpack, packing/sell). */
@Component({
  selector: 'app-parked-sales',
  imports: [ClarityModule, RouterLink, DatePipe, I18NextPipe, MoneyPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './parked-sales.component.html',
})
export class ParkedSalesComponent implements OnInit {
  private readonly sales = inject(SalesService);
  private readonly cart = inject(CartStore);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18NEXT_SERVICE);
  readonly terminal = inject(TerminalService);

  readonly parked = signal<Packing[]>([]);
  readonly loading = signal(true);
  readonly expanded = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.sales.parked().subscribe({
      next: (list) => {
        this.parked.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  async resume(packing: Packing): Promise<void> {
    if (!this.cart.isEmpty()) {
      const ok = await this.confirm.ask({
        title: this.i18n.t('parked.replaceTitle') as string,
        message: this.i18n.t('parked.replaceMessage') as string,
        confirmLabel: this.i18n.t('parked.resume') as string,
      });
      if (!ok) return;
    }
    this.cart.loadPacking(packing);
    void this.router.navigate(['/sales/pos']);
  }

  async discard(packing: Packing): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('parked.discardTitle') as string,
      message: this.i18n.t('parked.discardMessage', { count: packing.totalQty }) as string,
      confirmLabel: this.i18n.t('parked.discard') as string,
      danger: true,
    });
    if (!ok) return;
    this.sales.discardParked(packing.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('parked.discarded') as string);
        this.load();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}

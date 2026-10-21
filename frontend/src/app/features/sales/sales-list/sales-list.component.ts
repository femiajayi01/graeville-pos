import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClarityModule, ClrDatagridStateInterface } from '@clr/angular';
import { Order } from '@core/models';
import { SalesScope, SalesService } from '@core/services/sales.service';
import { UserService } from '@core/services/user.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NextPipe } from 'angular-i18next';

/**
 * Sales history. One component, three routes (Laravel: orders/mySales, orders/myRecentSales, orders/sales).
 */
@Component({
  selector: 'app-sales-list',
  imports: [
    ClarityModule,
    FormsModule,
    RouterLink,
    DatePipe,
    I18NextPipe,
    MoneyPipe,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sales-list.component.html',
})
export class SalesListComponent implements OnInit {
  /** From route data. */
  readonly scope = input<SalesScope>('mine-today');

  private readonly sales = inject(SalesService);
  private readonly users = inject(UserService);

  readonly orders = signal<Order[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly salespeople = signal<string[]>([]);
  readonly isAll = computed(() => this.scope() === 'all');
  readonly titleKey = computed(
    () =>
      ({
        'mine-today': 'nav.mySalesToday',
        'mine-recent': 'nav.myRecentSales',
        all: 'nav.allSales',
      })[this.scope()],
  );
  readonly pageTotal = computed(() => this.orders().reduce((acc, o) => acc + o.amountPaid, 0));

  search = '';
  from = '';
  to = '';
  salesperson = '';
  includeReturned = false;
  private lastState: ClrDatagridStateInterface = {};

  ngOnInit(): void {
    if (this.isAll()) {
      this.users
        .salespeople()
        .subscribe({ next: (list) => this.salespeople.set(list.map((u) => u.fullName)) });
    }
  }

  refresh(state: ClrDatagridStateInterface = this.lastState): void {
    this.lastState = state;
    this.loading.set(true);
    this.error.set(null);
    this.sales
      .list(this.scope(), {
        page: state.page?.current ?? 1,
        limit: state.page?.size ?? 25,
        search: this.search.trim() || undefined,
        ...(this.isAll()
          ? {
              from: this.from,
              to: this.to,
              salesperson: this.salesperson,
              includeReturned: this.includeReturned || undefined,
            }
          : {}),
      })
      .subscribe({
        next: (page) => {
          this.orders.set(page.data);
          this.total.set(page.meta.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.refresh({ ...this.lastState, page: { ...this.lastState.page, current: 1 } });
  }
}

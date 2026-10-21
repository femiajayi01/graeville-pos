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
import { RouterLink } from '@angular/router';
import { ClarityModule, ClrDatagridStateInterface } from '@clr/angular';
import { Customer, Order } from '@core/models';
import { CustomerService } from '@core/services/customer.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NextPipe } from 'angular-i18next';

/** Laravel: customer/view + customer/orderDetails. */
@Component({
  selector: 'app-customer-detail',
  imports: [ClarityModule, RouterLink, DatePipe, I18NextPipe, MoneyPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-detail.component.html',
})
export class CustomerDetailComponent implements OnInit {
  readonly id = input.required<string>();
  private readonly customers = inject(CustomerService);

  readonly customer = signal<Customer | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly spent = computed(() =>
    this.orders()
      .filter((o) => !o.isReturned)
      .reduce((a, o) => a + o.amountPaid, 0),
  );

  ngOnInit(): void {
    this.customers.get(Number(this.id())).subscribe({
      next: (c) => this.customer.set(c),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  refresh(state: ClrDatagridStateInterface): void {
    this.loading.set(true);
    this.customers
      .orders(Number(this.id()), { page: state.page?.current ?? 1, limit: state.page?.size ?? 20 })
      .subscribe({
        next: (page) => {
          this.orders.set(page.data);
          this.total.set(page.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClarityModule, ClrDatagridStateInterface } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { Customer } from '@core/models';
import { ConfirmService } from '@core/services/confirm.service';
import { CustomerService } from '@core/services/customer.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

/** Laravel: customer/index + customerName search. */
@Component({
  selector: 'app-customer-list',
  imports: [ClarityModule, FormsModule, RouterLink, DatePipe, I18NextPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent {
  readonly auth = inject(AuthService);
  private readonly customers = inject(CustomerService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly rows = signal<Customer[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  search = '';
  private lastState: ClrDatagridStateInterface = {};

  refresh(state: ClrDatagridStateInterface = this.lastState): void {
    this.lastState = state;
    this.loading.set(true);
    this.customers
      .list({
        page: state.page?.current ?? 1,
        limit: state.page?.size ?? 20,
        search: this.search.trim() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.rows.set(page.data);
          this.total.set(page.meta.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.error(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  applySearch(): void {
    this.refresh({ ...this.lastState, page: { ...this.lastState.page, current: 1 } });
  }

  async remove(c: Customer): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('customers.deleteTitle') as string,
      message: this.i18n.t('customers.deleteMessage', { name: c.fullName }) as string,
      confirmLabel: this.i18n.t('common.delete') as string,
      danger: true,
    });
    if (!ok) return;
    this.customers.delete(c.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('common.deleted', { name: c.fullName }) as string);
        this.refresh();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { Customer } from '@core/models';
import { CustomerService } from '@core/services/customer.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { I18NextPipe } from 'angular-i18next';

/** Laravel: customer/birthdays — customers whose birthday is today. */
@Component({
  selector: 'app-birthdays',
  imports: [ClarityModule, RouterLink, DatePipe, I18NextPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="'nav.birthdays' | i18next"
      [subtitle]="'customers.birthdaysHint' | i18next"
    />
    <clr-datagrid [clrDgLoading]="loading()">
      <clr-dg-column>{{ 'customers.fullName' | i18next }}</clr-dg-column>
      <clr-dg-column>{{ 'customers.phone' | i18next }}</clr-dg-column>
      <clr-dg-column>{{ 'customers.email' | i18next }}</clr-dg-column>
      <clr-dg-column>{{ 'customers.birthdate' | i18next }}</clr-dg-column>
      <clr-dg-column>{{ 'customers.age' | i18next }}</clr-dg-column>
      <clr-dg-placeholder>{{ 'customers.noBirthdays' | i18next }}</clr-dg-placeholder>
      @for (c of customers(); track c.id) {
        <clr-dg-row [clrDgItem]="c">
          <clr-dg-cell
            ><a [routerLink]="['/customers', c.id]">{{ c.fullName }}</a></clr-dg-cell
          >
          <clr-dg-cell
            ><a [href]="'tel:' + c.phoneNo">{{ c.phoneNo }}</a></clr-dg-cell
          >
          <clr-dg-cell>{{ c.email || '—' }}</clr-dg-cell>
          <clr-dg-cell>{{ c.birthdate | date: 'd MMMM yyyy' }}</clr-dg-cell>
          <clr-dg-cell>{{ age(c.birthdate) }}</clr-dg-cell>
        </clr-dg-row>
      }
      <clr-dg-footer>{{ customers().length }}</clr-dg-footer>
    </clr-datagrid>
  `,
})
export class BirthdaysComponent implements OnInit {
  private readonly service = inject(CustomerService);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.service.birthdays().subscribe({
      next: (list) => {
        this.customers.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Laravel helper getAge(). */
  age(birthdate: string | null): number | string {
    if (!birthdate) return '—';
    return new Date().getFullYear() - Number(birthdate.slice(0, 4));
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CloseDayReport, PaymentType } from '@core/models';
import { ReportService } from '@core/services/report.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { toDateKey } from '@shared/utils/date.util';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NextPipe } from 'angular-i18next';

/** End-of-day summary for the signed-in cashier (Laravel: report/closeDay). */
@Component({
  selector: 'app-close-day',
  imports: [ClarityModule, FormsModule, DatePipe, I18NextPipe, MoneyPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="'nav.closeDay' | i18next" [subtitle]="report()?.user ?? ''">
      <button type="button" class="btn btn-outline btn-sm no-print" (click)="print()">
        <cds-icon shape="printer"></cds-icon> {{ 'receipt.print' | i18next }}
      </button>
    </app-page-header>

    <form class="toolbar no-print" (ngSubmit)="load()">
      <clr-input-container>
        <label>{{ 'reports.date' | i18next }}</label>
        <input type="date" clrInput name="date" [(ngModel)]="date" />
      </clr-input-container>
      <button type="submit" class="btn btn-primary btn-sm" [clrLoading]="loading()">
        {{ 'reports.run' | i18next }}
      </button>
    </form>

    @if (error()) {
      <clr-alert clrAlertType="danger" [clrAlertClosable]="false">
        <clr-alert-item
          ><span class="alert-text">{{ error() }}</span></clr-alert-item
        >
      </clr-alert>
    }

    @if (report(); as r) {
      @if (r.orderCount === 0) {
        <p class="text-muted">{{ 'reports.noSalesDay' | i18next }}</p>
      }
      <table class="table table-vertical close-day">
        <tbody>
          <tr>
            <th>{{ 'reports.date' | i18next }}</th>
            <td>{{ r.date | date: 'EEEE, d MMMM yyyy' }}</td>
          </tr>
          <tr>
            <th>{{ 'reports.orders' | i18next }}</th>
            <td>{{ r.orderCount }}</td>
          </tr>
          <tr>
            <th>{{ 'reports.itemsSoldLabel' | i18next }}</th>
            <td>{{ r.itemCount }}</td>
          </tr>
          @for (t of paymentTypes; track t) {
            <tr>
              <th>{{ t }}</th>
              <td class="num">{{ r.byPaymentType[t] | money }}</td>
            </tr>
          }
          <tr class="total">
            <th>{{ 'reports.totalAmount' | i18next }}</th>
            <td class="num">{{ r.amountPaid | money }}</td>
          </tr>
        </tbody>
      </table>
    }
  `,
  styles: `
    .close-day {
      max-width: 520px;
    }
    .total th,
    .total td {
      font-size: 1em;
      font-weight: 600;
    }
  `,
})
export class CloseDayComponent implements OnInit {
  private readonly reports = inject(ReportService);
  readonly report = signal<CloseDayReport | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly paymentTypes = Object.values(PaymentType);
  date = toDateKey();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports.closeDay(this.date).subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  print(): void {
    window.print();
  }
}

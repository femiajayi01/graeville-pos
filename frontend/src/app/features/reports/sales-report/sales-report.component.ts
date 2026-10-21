import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { PaymentType, SalesReport } from '@core/models';
import { ReportService } from '@core/services/report.service';
import { UserService } from '@core/services/user.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { daysAgo, toDateKey } from '@shared/utils/date.util';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NextPipe } from 'angular-i18next';

/** Laravel: report/index (sales between dates) and report/salesPerson. */
@Component({
  selector: 'app-sales-report',
  imports: [
    ClarityModule,
    FormsModule,
    RouterLink,
    DatePipe,
    I18NextPipe,
    MoneyPipe,
    PageHeaderComponent,
    StatCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sales-report.component.html',
})
export class SalesReportComponent implements OnInit {
  readonly bySalesperson = input(false);

  private readonly reports = inject(ReportService);
  private readonly users = inject(UserService);

  readonly report = signal<SalesReport | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly salespeople = signal<string[]>([]);
  readonly paymentTypes = Object.values(PaymentType);

  from = daysAgo(6);
  to = toDateKey();
  salesperson = '';

  ngOnInit(): void {
    if (this.bySalesperson()) {
      this.users.salespeople().subscribe((list) => {
        this.salespeople.set(list.map((u) => u.fullName));
        this.salesperson = list[0]?.fullName ?? '';
      });
    } else {
      this.run();
    }
  }

  run(): void {
    if (this.bySalesperson() && !this.salesperson) return;
    this.loading.set(true);
    this.error.set(null);
    this.reports
      .sales(this.from, this.to, this.bySalesperson() ? this.salesperson : undefined)
      .subscribe({
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

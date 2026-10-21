import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { DashboardStats } from '@core/models';
import { ReportService } from '@core/services/report.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { I18NextPipe } from 'angular-i18next';

/** Laravel: dashboard.blade.php — quick links plus today's numbers. */
@Component({
  selector: 'app-dashboard',
  imports: [
    ClarityModule,
    RouterLink,
    I18NextPipe,
    MoneyPipe,
    PageHeaderComponent,
    StatCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly reports = inject(ReportService);
  readonly stats = signal<DashboardStats | null>(null);

  readonly shortcuts = [
    { path: '/sales/pos', icon: 'bar-code', label: 'nav.sell', hint: 'dashboard.sellHint' },
    {
      path: '/sales/mine/today',
      icon: 'wallet',
      label: 'nav.mySalesToday',
      hint: 'dashboard.mySalesHint',
    },
    {
      path: '/sales/mine/recent',
      icon: 'history',
      label: 'nav.myRecentSales',
      hint: 'dashboard.recentHint',
    },
    { path: '/products', icon: 'tag', label: 'nav.products', hint: 'dashboard.productsHint' },
    { path: '/customers', icon: 'users', label: 'nav.customers', hint: 'dashboard.customersHint' },
    {
      path: '/reports/close-day',
      icon: 'line-chart',
      label: 'nav.closeDay',
      hint: 'dashboard.closeDayHint',
    },
  ];

  ngOnInit(): void {
    this.reports.dashboard().subscribe((stats) => this.stats.set(stats));
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { ReportService } from '@core/services/report.service';
import { SalesService } from '@core/services/sales.service';
import { StoreInfoService } from '@core/services/store-info.service';
import { TerminalService } from '@core/services/terminal.service';
import { ToastService } from '@core/services/toast.service';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NextPipe } from 'angular-i18next';
import { filter } from 'rxjs';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  managerOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: string;
  managerOnly?: boolean;
  items: NavItem[];
}

/** Authenticated layout: Clarity header + collapsible vertical nav (Laravel: includes/header.blade.php). */
@Component({
  selector: 'app-shell',
  imports: [ClarityModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, I18NextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly terminal = inject(TerminalService);
  readonly storeInfo = inject(StoreInfoService);
  private readonly reports = inject(ReportService);
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly parkedCount = signal(0);
  readonly birthdayCount = signal(0);
  readonly navCollapsed = signal(false);
  invoiceNumber = '';

  readonly nav: NavGroup[] = [
    {
      label: 'nav.sales',
      icon: 'shopping-cart',
      items: [
        { path: '/sales/pos', label: 'nav.sell', icon: 'bar-code' },
        { path: '/sales/parked', label: 'nav.parked', icon: 'pause' },
        { path: '/sales/mine/today', label: 'nav.mySalesToday', icon: 'wallet' },
        { path: '/sales/mine/recent', label: 'nav.myRecentSales', icon: 'history' },
        { path: '/sales/all', label: 'nav.allSales', icon: 'list', managerOnly: true },
      ],
    },
    {
      label: 'nav.inventory',
      icon: 'store',
      items: [
        { path: '/products', label: 'nav.products', icon: 'tag' },
        { path: '/brands', label: 'nav.brands', icon: 'tags' },
        { path: '/categories', label: 'nav.categories', icon: 'tags' },
      ],
    },
    {
      label: 'nav.customers',
      icon: 'users',
      items: [
        { path: '/customers', label: 'nav.allCustomers', icon: 'users' },
        { path: '/customers/birthdays', label: 'nav.birthdays', icon: 'birthday-cake' },
      ],
    },
    {
      label: 'nav.reports',
      icon: 'line-chart',
      items: [
        { path: '/reports/close-day', label: 'nav.closeDay', icon: 'wallet' },
        { path: '/reports/sales', label: 'nav.salesReport', icon: 'line-chart', managerOnly: true },
        {
          path: '/reports/salesperson',
          label: 'nav.salespersonReport',
          icon: 'employee-group',
          managerOnly: true,
        },
        {
          path: '/reports/out-of-stock',
          label: 'nav.outOfStock',
          icon: 'exclamation-triangle',
          managerOnly: true,
        },
      ],
    },
    {
      label: 'nav.admin',
      icon: 'lock',
      items: [
        { path: '/users', label: 'nav.users', icon: 'employee-group', managerOnly: true },
        { path: '/settings/store', label: 'nav.storeSettings', icon: 'store', managerOnly: true },
        { path: '/sync', label: 'nav.sync', icon: 'sync' },
      ],
    },
  ];

  ngOnInit(): void {
    this.storeInfo.load();
    this.refreshBadges();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.refreshBadges());
  }

  visible(items: NavItem[]): NavItem[] {
    return items.filter((i) => !i.managerOnly || this.auth.isManager());
  }

  /** Header quick search by invoice number (Laravel: product/searchInvoice). */
  findInvoice(): void {
    const value = this.invoiceNumber.trim();
    if (!value) return;
    this.sales.findByNumber(value).subscribe({
      next: (order) => {
        this.invoiceNumber = '';
        void this.router.navigate(['/sales/receipt', order.id]);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  private refreshBadges(): void {
    this.reports.dashboard().subscribe({
      next: (stats) => {
        this.parkedCount.set(stats.parkedSales);
        this.birthdayCount.set(stats.birthdaysToday);
      },
      error: () => undefined,
    });
  }
}

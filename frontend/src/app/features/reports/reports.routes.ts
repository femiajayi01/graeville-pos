import { Routes } from '@angular/router';
import { managerGuard } from '@core/auth/auth.guards';

export const REPORT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'close-day' },
  {
    path: 'close-day',
    title: 'Close of day',
    loadComponent: () => import('./close-day/close-day.component').then((m) => m.CloseDayComponent),
  },
  {
    path: 'sales',
    title: 'Sales report',
    canActivate: [managerGuard],
    data: { bySalesperson: false },
    loadComponent: () =>
      import('./sales-report/sales-report.component').then((m) => m.SalesReportComponent),
  },
  {
    path: 'salesperson',
    title: 'Sales by salesperson',
    canActivate: [managerGuard],
    data: { bySalesperson: true },
    loadComponent: () =>
      import('./sales-report/sales-report.component').then((m) => m.SalesReportComponent),
  },
  {
    path: 'out-of-stock',
    title: 'Out of stock',
    canActivate: [managerGuard],
    loadComponent: () =>
      import('./out-of-stock/out-of-stock.component').then((m) => m.OutOfStockComponent),
  },
];

import { Routes } from '@angular/router';
import { managerGuard } from '@core/auth/auth.guards';

export const SALES_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pos' },
  {
    path: 'pos',
    title: 'Sell',
    loadComponent: () => import('./pos/pos.component').then((m) => m.PosComponent),
  },
  {
    path: 'parked',
    title: 'Parked sales',
    loadComponent: () =>
      import('./parked/parked-sales.component').then((m) => m.ParkedSalesComponent),
  },
  {
    path: 'receipt/:id',
    title: 'Receipt',
    loadComponent: () => import('./receipt/receipt.component').then((m) => m.ReceiptComponent),
  },
  {
    path: 'mine/today',
    title: 'My sales today',
    data: { scope: 'mine-today' },
    loadComponent: () =>
      import('./sales-list/sales-list.component').then((m) => m.SalesListComponent),
  },
  {
    path: 'mine/recent',
    title: 'My recent sales',
    data: { scope: 'mine-recent' },
    loadComponent: () =>
      import('./sales-list/sales-list.component').then((m) => m.SalesListComponent),
  },
  {
    path: 'all',
    title: 'All sales',
    data: { scope: 'all' },
    canActivate: [managerGuard],
    loadComponent: () =>
      import('./sales-list/sales-list.component').then((m) => m.SalesListComponent),
  },
];

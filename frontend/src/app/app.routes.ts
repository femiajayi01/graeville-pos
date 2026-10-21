import { Routes } from '@angular/router';
import { authGuard, guestGuard, managerGuard } from './core/auth/auth.guards';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.routes').then((m) => m.SALES_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then((m) => m.PRODUCT_ROUTES),
      },
      {
        path: 'brands',
        title: 'Brands',
        loadComponent: () =>
          import('./features/brands/brand-list.component').then((m) => m.BrandListComponent),
      },
      {
        path: 'categories',
        title: 'Categories',
        loadComponent: () =>
          import('./features/categories/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./features/customers/customers.routes').then((m) => m.CUSTOMER_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORT_ROUTES),
      },
      {
        path: 'users',
        title: 'Users',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'profile',
        title: 'My profile',
        loadComponent: () =>
          import('./features/users/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'settings/store',
        title: 'Store settings',
        canActivate: [managerGuard],
        loadComponent: () =>
          import('./features/settings/store-settings.component').then(
            (m) => m.StoreSettingsComponent,
          ),
      },
      {
        path: 'sync',
        title: 'Online sync',
        loadComponent: () => import('./features/sync/sync.component').then((m) => m.SyncComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

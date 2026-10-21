import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    title: 'Customers',
    loadComponent: () =>
      import('./customer-list/customer-list.component').then((m) => m.CustomerListComponent),
  },
  {
    path: 'birthdays',
    title: "Today's birthdays",
    loadComponent: () =>
      import('./birthdays/birthdays.component').then((m) => m.BirthdaysComponent),
  },
  {
    path: 'new',
    title: 'New customer',
    loadComponent: () =>
      import('./customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit customer',
    loadComponent: () =>
      import('./customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
  },
  {
    path: ':id',
    title: 'Customer',
    loadComponent: () =>
      import('./customer-detail/customer-detail.component').then((m) => m.CustomerDetailComponent),
  },
];

import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    title: 'Products',
    loadComponent: () =>
      import('./product-list/product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: 'new',
    title: 'New product',
    loadComponent: () =>
      import('./product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit product',
    loadComponent: () =>
      import('./product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
];

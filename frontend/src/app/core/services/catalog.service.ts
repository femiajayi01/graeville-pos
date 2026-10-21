import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  Brand,
  Category,
  ImportResult,
  PageQuery,
  Paginated,
  Product,
  ProductPayload,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  list(query: PageQuery & { brandId?: number; categoryId?: number; outOfStock?: boolean }) {
    return this.api.get<Paginated<Product>>('products', query);
  }
  get(id: number) {
    return this.api.get<Product>(`products/${id}`);
  }
  /** Barcode or exact name (sell screen). */
  lookup(code: string) {
    return this.api.get<Product>('products/lookup', { code });
  }
  search(q: string) {
    return this.api.get<Product[]>('products/search', { q });
  }
  create(payload: ProductPayload) {
    return this.api.post<Product>('products', payload);
  }
  update(id: number, payload: Partial<ProductPayload>) {
    return this.api.patch<Product>(`products/${id}`, payload);
  }
  delete(id: number) {
    return this.api.delete(`products/${id}`);
  }
  exportExcel(): Observable<Blob> {
    return this.api.download('products/export');
  }
  importExcel(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.api.post<ImportResult>('products/import', form);
  }
}

/** Brands and categories share the same API shape. */
abstract class LookupService<T> {
  protected readonly api = inject(ApiService);
  protected abstract readonly path: string;

  list(query: PageQuery) {
    return this.api.get<Paginated<T>>(this.path, query);
  }
  options() {
    return this.api.get<T[]>(`${this.path}/options`);
  }
  create(name: string) {
    return this.api.post<T>(this.path, { name });
  }
  update(id: number, name: string) {
    return this.api.patch<T>(`${this.path}/${id}`, { name });
  }
  delete(id: number) {
    return this.api.delete(`${this.path}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class BrandService extends LookupService<Brand> {
  protected readonly path = 'brands';
}

@Injectable({ providedIn: 'root' })
export class CategoryService extends LookupService<Category> {
  protected readonly path = 'categories';
}

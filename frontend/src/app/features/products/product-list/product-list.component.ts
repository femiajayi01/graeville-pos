import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClarityModule, ClrDatagridStateInterface } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { Brand, Category, ImportResult, Product } from '@core/models';
import { BrandService, CategoryService, ProductService } from '@core/services/catalog.service';
import { ConfirmService } from '@core/services/confirm.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { saveBlob } from '@shared/utils/file.util';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

/** Laravel: product/index (+ productName search, Excel import/export). */
@Component({
  selector: 'app-product-list',
  imports: [ClarityModule, FormsModule, RouterLink, I18NextPipe, MoneyPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly products = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly rows = signal<Product[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly importOpen = signal(false);
  readonly importing = signal(false);
  readonly importResult = signal<ImportResult | null>(null);
  readonly exporting = signal(false);

  search = '';
  brandId = '';
  categoryId = '';
  outOfStock = false;
  private file: File | null = null;
  private lastState: ClrDatagridStateInterface = {};

  ngOnInit(): void {
    this.brandService.options().subscribe((list) => this.brands.set(list));
    this.categoryService.options().subscribe((list) => this.categories.set(list));
  }

  refresh(state: ClrDatagridStateInterface = this.lastState): void {
    this.lastState = state;
    this.loading.set(true);
    this.products
      .list({
        page: state.page?.current ?? 1,
        limit: state.page?.size ?? 50,
        search: this.search.trim() || undefined,
        brandId: this.brandId ? Number(this.brandId) : undefined,
        categoryId: this.categoryId ? Number(this.categoryId) : undefined,
        outOfStock: this.outOfStock || undefined,
      })
      .subscribe({
        next: (page) => {
          this.rows.set(page.data);
          this.total.set(page.meta.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.error(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.refresh({ ...this.lastState, page: { ...this.lastState.page, current: 1 } });
  }

  async remove(product: Product): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('products.deleteTitle') as string,
      message: this.i18n.t('products.deleteMessage', { name: product.name }) as string,
      confirmLabel: this.i18n.t('common.delete') as string,
      danger: true,
    });
    if (!ok) return;
    this.products.delete(product.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('products.deleted') as string);
        this.refresh();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.products.exportExcel().subscribe({
      next: (blob) => {
        saveBlob(blob, 'productList.xlsx');
        this.exporting.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.exporting.set(false);
      },
    });
  }

  onFile(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  openImport(): void {
    this.file = null;
    this.importResult.set(null);
    this.importOpen.set(true);
  }

  importExcel(): void {
    if (!this.file) return;
    this.importing.set(true);
    this.products.importExcel(this.file).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.importing.set(false);
        this.refresh();
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.importing.set(false);
      },
    });
  }
}

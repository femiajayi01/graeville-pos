import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { Brand, Category, ProductPayload } from '@core/models';
import { BrandService, CategoryService, ProductService } from '@core/services/catalog.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

/** Create / edit a product (Laravel: product/create + product/edit). */
@Component({
  selector: 'app-product-form',
  imports: [ClarityModule, ReactiveFormsModule, RouterLink, I18NextPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  /** Route param — absent when creating. */
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly products = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    barcode: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    costPrice: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    sellingPrice: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    quantity: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d+$/),
    ]),
    brandId: this.fb.control<number | null>(null),
    categoryId: this.fb.control<number | null>(null),
    description: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.brandService.options().subscribe((list) => this.brands.set(list));
    this.categoryService.options().subscribe((list) => this.categories.set(list));
    const id = this.id();
    if (id) {
      this.products.get(Number(id)).subscribe({
        next: (p) => this.form.patchValue(p),
        error: (err) => this.error.set(errorMessage(err)),
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: ProductPayload = {
      name: v.name.trim(),
      barcode: v.barcode.trim(),
      costPrice: Number(v.costPrice),
      sellingPrice: Number(v.sellingPrice),
      quantity: Number(v.quantity),
      brandId: v.brandId ? Number(v.brandId) : null,
      categoryId: v.categoryId ? Number(v.categoryId) : null,
      description: v.description || null,
    };
    const id = this.id();
    this.saving.set(true);
    this.error.set(null);
    const request = id ? this.products.update(Number(id), payload) : this.products.create(payload);
    request.subscribe({
      next: () => {
        this.toast.success(this.i18n.t(id ? 'products.updated' : 'products.created') as string);
        void this.router.navigate(['/products']);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}

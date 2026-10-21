import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { Product } from '@core/models';
import { ReportService } from '@core/services/report.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { I18NextPipe } from 'angular-i18next';

/** Laravel: report/outStock — with an optional low-stock threshold. */
@Component({
  selector: 'app-out-of-stock',
  imports: [ClarityModule, FormsModule, RouterLink, I18NextPipe, MoneyPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="'nav.outOfStock' | i18next"
      [subtitle]="'reports.outOfStockHint' | i18next"
    />
    <form class="toolbar" (ngSubmit)="load()">
      <clr-input-container>
        <label>{{ 'reports.threshold' | i18next }}</label>
        <input clrInput type="number" min="0" name="threshold" [(ngModel)]="threshold" />
      </clr-input-container>
      <button type="submit" class="btn btn-primary btn-sm">{{ 'reports.run' | i18next }}</button>
    </form>
    <clr-datagrid [clrDgLoading]="loading()">
      <clr-dg-column>{{ 'products.name' | i18next }}</clr-dg-column>
      <clr-dg-column>{{ 'products.barcode' | i18next }}</clr-dg-column>
      <clr-dg-column>{{ 'products.brand' | i18next }}</clr-dg-column>
      <clr-dg-column>{{ 'products.category' | i18next }}</clr-dg-column>
      <clr-dg-column class="num">{{ 'products.costPrice' | i18next }}</clr-dg-column>
      <clr-dg-column class="num">{{ 'products.sellingPrice' | i18next }}</clr-dg-column>
      <clr-dg-column class="num">{{ 'products.stock' | i18next }}</clr-dg-column>
      <clr-dg-placeholder>{{ 'reports.allInStock' | i18next }}</clr-dg-placeholder>
      <clr-dg-row *clrDgItems="let p of products()" [clrDgItem]="p">
        <clr-dg-cell
          ><a [routerLink]="['/products', p.id, 'edit']">{{ p.name }}</a></clr-dg-cell
        >
        <clr-dg-cell>{{ p.barcode }}</clr-dg-cell>
        <clr-dg-cell>{{ p.brand?.name || '—' }}</clr-dg-cell>
        <clr-dg-cell>{{ p.category?.name || '—' }}</clr-dg-cell>
        <clr-dg-cell class="num">{{ p.costPrice | money }}</clr-dg-cell>
        <clr-dg-cell class="num">{{ p.sellingPrice | money }}</clr-dg-cell>
        <clr-dg-cell class="num">{{ p.quantity }}</clr-dg-cell>
      </clr-dg-row>
      <clr-dg-footer>{{ products().length }} {{ 'nav.products' | i18next }}</clr-dg-footer>
    </clr-datagrid>
  `,
})
export class OutOfStockComponent implements OnInit {
  private readonly reports = inject(ReportService);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  threshold = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.reports.outOfStock(Number(this.threshold) || 0).subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

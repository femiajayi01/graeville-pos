import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { Order, Product } from '@core/models';
import { ProductService } from '@core/services/catalog.service';
import { ConfirmService } from '@core/services/confirm.service';
import { SalesService } from '@core/services/sales.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { AddResult, CartStore } from '../cart.store';
import { CheckoutModalComponent } from '../checkout/checkout-modal.component';

/**
 * The sell screen (Laravel: orders/create + orders/createName + the cart AJAX endpoints).
 * Scan a barcode or type a product name, adjust quantities, then park the sale or check out.
 */
@Component({
  selector: 'app-pos',
  imports: [
    ClarityModule,
    FormsModule,
    RouterLink,
    I18NextPipe,
    MoneyPipe,
    PageHeaderComponent,
    CheckoutModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  readonly cart = inject(CartStore);
  private readonly products = inject(ProductService);
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18NEXT_SERVICE);
  private readonly destroyRef = inject(DestroyRef);

  private readonly scanInput = viewChild<ElementRef<HTMLInputElement>>('scanInput');
  private readonly searchTerms = new Subject<string>();

  code = '';
  parkLabel = '';
  readonly suggestions = signal<Product[]>([]);
  readonly looking = signal(false);
  readonly checkoutOpen = signal(false);
  readonly parkOpen = signal(false);
  readonly parking = signal(false);

  ngOnInit(): void {
    this.searchTerms
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) =>
          term.trim().length < 2
            ? of([])
            : this.products.search(term).pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => this.suggestions.set(list));
    this.focusScan();
  }

  onType(value: string): void {
    this.searchTerms.next(value);
  }

  /** Enter in the scan box: exact barcode/name lookup (what a barcode scanner sends). */
  scan(): void {
    const value = this.code.trim();
    if (!value) return;
    this.looking.set(true);
    this.products.lookup(value).subscribe({
      next: (product) => {
        this.addProduct(product);
        this.looking.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.looking.set(false);
        this.resetScan();
      },
    });
  }

  pick(product: Product): void {
    this.addProduct(product);
  }

  setQuantity(productId: number, value: number | string): void {
    const requested = Number(value);
    const applied = this.cart.setQuantity(productId, requested);
    if (applied < requested)
      this.toast.warning(this.i18n.t('pos.cappedToStock', { count: applied }) as string);
  }

  increment(productId: number, name: string): void {
    if (!this.cart.increment(productId))
      this.toast.warning(this.i18n.t('pos.noMoreStock', { name }) as string);
  }

  async clearCart(): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('pos.clearTitle') as string,
      message: this.i18n.t('pos.clearMessage') as string,
      confirmLabel: this.i18n.t('pos.clear') as string,
      danger: true,
    });
    if (ok) {
      this.cart.clear();
      this.focusScan();
    }
  }

  /** Park the current cart on this till (Laravel: "Pack Sales"). */
  park(): void {
    this.parking.set(true);
    this.sales.park(this.cart.lines(), this.parkLabel).subscribe({
      next: () => {
        // Resuming a parked sale and parking again replaces the old one.
        const previous = this.cart.packingId();
        if (previous) this.sales.discardParked(previous).subscribe({ error: () => undefined });
        this.cart.clear();
        this.parkLabel = '';
        this.parkOpen.set(false);
        this.parking.set(false);
        this.toast.success(this.i18n.t('pos.parked') as string);
        this.focusScan();
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.parking.set(false);
      },
    });
  }

  onCompleted(order: Order): void {
    this.checkoutOpen.set(false);
    this.cart.clear();
    this.toast.success(this.i18n.t('checkout.completed', { number: order.orderNumber }) as string);
    void this.router.navigate(['/sales/receipt', order.id], { queryParams: { print: 1 } });
  }

  private addProduct(product: Product): void {
    const result: AddResult = this.cart.add(product);
    if (!result.ok) {
      const key = result.reason === 'out-of-stock' ? 'pos.outOfStock' : 'pos.onlyLeft';
      this.toast.warning(
        this.i18n.t(key, { name: product.name, count: result.available }) as string,
      );
    }
    this.resetScan();
  }

  private resetScan(): void {
    this.code = '';
    this.suggestions.set([]);
    this.searchTerms.next('');
    this.focusScan();
  }

  private focusScan(): void {
    setTimeout(() => this.scanInput()?.nativeElement.focus());
  }
}

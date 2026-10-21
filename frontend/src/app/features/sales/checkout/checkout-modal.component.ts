import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CheckoutPayload, Customer, Order, PaymentType } from '@core/models';
import { CustomerService } from '@core/services/customer.service';
import { SalesService } from '@core/services/sales.service';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';
import { CartStore } from '../cart.store';

type CustomerMode = 'walk-in' | 'existing' | 'new';

/**
 * Checkout dialog (Laravel: orders/checkout.blade.php + postCheckoutPage).
 * Customer: walk-in, an existing customer (by phone or name), or register a new one.
 */
@Component({
  selector: 'app-checkout-modal',
  imports: [ClarityModule, FormsModule, ReactiveFormsModule, I18NextPipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout-modal.component.html',
  styleUrl: './checkout-modal.component.scss',
})
export class CheckoutModalComponent {
  readonly cart = inject(CartStore);
  private readonly customers = inject(CustomerService);
  private readonly sales = inject(SalesService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly closed = output<void>();
  readonly completed = output<Order>();

  readonly paymentTypes = Object.values(PaymentType);
  readonly mode = signal<CustomerMode>('walk-in');
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly searchResults = signal<Customer[]>([]);
  readonly searching = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly discount = signal(0);
  customerQuery = '';

  readonly amountDue = computed(() =>
    Math.max(0, Math.round((this.cart.totalPrice() - this.discount()) * 100) / 100),
  );
  readonly discountInvalid = computed(
    () => this.discount() < 0 || this.discount() > this.cart.totalPrice(),
  );

  readonly payment = this.fb.nonNullable.control<PaymentType | ''>('', Validators.required);

  readonly newCustomer = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    phoneNo: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{7,18}$/)]],
    email: ['', Validators.email],
    address: [''],
    birthdate: [''],
  });

  setMode(mode: CustomerMode): void {
    this.mode.set(mode);
    this.error.set(null);
    if (mode !== 'existing') {
      this.selectedCustomer.set(null);
      this.searchResults.set([]);
    }
  }

  setDiscount(value: number | string | null): void {
    this.discount.set(Number(value) || 0);
  }

  /** Phone number → exact lookup; anything else → name search (Laravel: customerSearch / customerSearchName). */
  findCustomer(): void {
    const q = this.customerQuery.trim();
    if (!q) return;
    this.searching.set(true);
    this.selectedCustomer.set(null);
    const isPhone = /^\+?[0-9 ]{5,}$/.test(q);

    if (isPhone) {
      this.customers.lookupByPhone(q).subscribe({
        next: (customer) => {
          this.searching.set(false);
          if (customer) {
            this.selectedCustomer.set(customer);
            this.searchResults.set([]);
          } else {
            // Not registered: switch to "new customer" with the number pre-filled (Laravel behaviour).
            this.newCustomer.patchValue({ phoneNo: q });
            this.setMode('new');
          }
        },
        error: (err) => this.fail(err),
      });
    } else {
      this.customers.list({ search: q, limit: 10 }).subscribe({
        next: (page) => {
          this.searchResults.set(page.data);
          this.searching.set(false);
        },
        error: (err) => this.fail(err),
      });
    }
  }

  submit(): void {
    this.error.set(null);
    if (this.payment.invalid) {
      this.payment.markAsTouched();
      return;
    }
    if (this.discountInvalid()) return;

    const payload: CheckoutPayload = {
      items: this.cart.lines(),
      paymentType: this.payment.value as PaymentType,
      discount: this.discount() || 0,
      packingId: this.cart.packingId() ?? undefined,
    };

    if (this.mode() === 'existing') {
      const customer = this.selectedCustomer();
      if (!customer) {
        this.error.set(this.i18n.t('checkout.selectCustomer') as string);
        return;
      }
      payload.customerId = customer.id;
    }
    if (this.mode() === 'new') {
      if (this.newCustomer.invalid) {
        this.newCustomer.markAllAsTouched();
        return;
      }
      const c = this.newCustomer.getRawValue();
      payload.newCustomer = {
        fullName: c.fullName,
        phoneNo: c.phoneNo.replace(/\s+/g, ''),
        email: c.email || undefined,
        address: c.address || undefined,
        birthdate: c.birthdate || undefined,
      };
    }

    this.submitting.set(true);
    this.sales.checkout(payload).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.completed.emit(order);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  private fail(err: unknown) {
    this.searching.set(false);
    this.error.set(errorMessage(err));
  }
}

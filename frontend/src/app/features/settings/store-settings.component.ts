import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { StoreSettings } from '@core/models';
import { StoreInfoService } from '@core/services/store-info.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { MoneyPipe } from '@shared/pipes/money.pipe';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

/**
 * Customise the store for each customer (name, receipt address/phone, footer)
 * without touching .env or restarting the API. Admin / Super Admin only.
 */
@Component({
  selector: 'app-store-settings',
  imports: [
    ClarityModule,
    ReactiveFormsModule,
    DatePipe,
    I18NextPipe,
    MoneyPipe,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './store-settings.component.html',
  styleUrl: './store-settings.component.scss',
})
export class StoreSettingsComponent implements OnInit {
  readonly storeInfo = inject(StoreInfoService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18NEXT_SERVICE);
  private readonly fb = inject(FormBuilder);

  readonly saved = signal<StoreSettings | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    storeName: ['', [Validators.required, Validators.maxLength(150)]],
    address: ['', Validators.maxLength(500)],
    phone: ['', Validators.maxLength(100)],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    receiptFooter: ['', Validators.maxLength(500)],
    currency: ['NGN', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
  });

  /** Live values for the receipt preview. */
  readonly preview = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  ngOnInit(): void {
    this.storeInfo.getSettings().subscribe({
      next: (s) => this.apply(s),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.storeInfo.saveSettings({ ...v, currency: v.currency.toUpperCase() }).subscribe({
      next: (s) => {
        this.apply(s);
        this.saving.set(false);
        this.storeInfo.load(true); // header, login page and receipts pick it up straight away
        this.toast.success(this.i18n.t('settings.saved') as string);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  reset(): void {
    const s = this.saved();
    if (s) this.apply(s);
  }

  private apply(s: StoreSettings): void {
    this.saved.set(s);
    this.form.reset({
      storeName: s.storeName,
      address: s.address,
      phone: s.phone,
      email: s.email,
      receiptFooter: s.receiptFooter,
      currency: s.currency,
    });
  }
}

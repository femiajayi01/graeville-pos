import { inject, Pipe, PipeTransform } from '@angular/core';
import { StoreInfoService } from '@core/services/store-info.service';

const formatters = new Map<string, Intl.NumberFormat>();

const formatterFor = (currency: string): Intl.NumberFormat => {
  let f = formatters.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 2 });
    } catch {
      f = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
      });
    }
    formatters.set(currency, f);
  }
  return f;
};

/**
 * 3200.5 → ₦3,200.50, in the currency set under Store settings (NGN by default).
 * Impure so prices re-render if the currency setting changes; formatting is cached, so it's cheap.
 */
@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly store = inject(StoreInfoService);

  transform(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    return formatterFor(this.store.info()?.currency ?? 'NGN').format(Number.isFinite(n) ? n : 0);
  }
}

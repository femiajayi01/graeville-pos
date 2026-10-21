import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../http/api.service';
import { StoreInfo, StoreSettings } from '../models';

/**
 * Product name + the customer's store details (name, address, phone, receipt footer).
 * Shown in the header, login page, browser tab and receipts. Editable in Store settings.
 */
@Injectable({ providedIn: 'root' })
export class StoreInfoService {
  private readonly api = inject(ApiService);
  readonly info = signal<StoreInfo | null>(null);

  load(force = false): void {
    if (this.info() && !force) return;
    this.api
      .get<StoreInfo>('store-info')
      .subscribe({ next: (info) => this.info.set(info), error: () => undefined });
  }

  getSettings() {
    return this.api.get<StoreSettings>('settings/store');
  }

  saveSettings(changes: Partial<StoreSettings>) {
    return this.api.put<StoreSettings>('settings/store', changes);
  }
}

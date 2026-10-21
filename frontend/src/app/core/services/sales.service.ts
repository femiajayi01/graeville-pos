import { inject, Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import { CartLine, CheckoutPayload, Order, Packing, PageQuery, Paginated } from '../models';

export type SalesScope = 'mine-today' | 'mine-recent' | 'all';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly api = inject(ApiService);

  checkout(payload: CheckoutPayload) {
    return this.api.post<Order>('orders/checkout', payload);
  }
  list(scope: SalesScope, query: PageQuery) {
    const path = {
      'mine-today': 'orders/mine/today',
      'mine-recent': 'orders/mine/recent',
      all: 'orders',
    }[scope];
    return this.api.get<Paginated<Order>>(path, query);
  }
  get(id: number) {
    return this.api.get<Order>(`orders/${id}`);
  }
  findByNumber(orderNumber: string) {
    return this.api.get<Order>(`orders/number/${encodeURIComponent(orderNumber.trim())}`);
  }
  returnOrder(id: number) {
    return this.api.post<Order>(`orders/${id}/return`);
  }
  emailReceipt(id: number, email: string) {
    return this.api.post<{ message: string }>(`orders/${id}/email-receipt`, { email });
  }

  // Parked sales
  parked() {
    return this.api.get<Packing[]>('packings');
  }
  getParked(id: number) {
    return this.api.get<Packing>(`packings/${id}`);
  }
  park(items: CartLine[], label?: string) {
    return this.api.post<Packing>('packings', { items, label: label || undefined });
  }
  discardParked(id: number) {
    return this.api.delete(`packings/${id}`);
  }
}

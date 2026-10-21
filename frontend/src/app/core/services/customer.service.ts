import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Customer, CustomerPayload, Order, PageQuery, Paginated } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);

  list(query: PageQuery) {
    return this.api.get<Paginated<Customer>>('customers', query);
  }
  get(id: number) {
    return this.api.get<Customer>(`customers/${id}`);
  }
  orders(id: number, query: PageQuery) {
    return this.api.get<Paginated<Order>>(`customers/${id}/orders`, query);
  }
  birthdays() {
    return this.api.get<Customer[]>('customers/birthdays');
  }
  lookupByPhone(phone: string) {
    return this.api
      .get<{ customer: Customer | null }>('customers/lookup', { phone })
      .pipe(map((r) => r.customer));
  }
  create(payload: CustomerPayload) {
    return this.api.post<Customer>('customers', payload);
  }
  update(id: number, payload: Partial<CustomerPayload>) {
    return this.api.patch<Customer>(`customers/${id}`, payload);
  }
  delete(id: number) {
    return this.api.delete(`customers/${id}`);
  }
}

import { inject, Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import {
  CloseDayReport,
  DashboardStats,
  Product,
  SalesReport,
  SyncRunResult,
  SyncStatus,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);

  dashboard() {
    return this.api.get<DashboardStats>('reports/dashboard');
  }
  sales(from: string, to: string, salesperson?: string) {
    return this.api.get<SalesReport>('reports/sales', { from, to, salesperson });
  }
  closeDay(date?: string) {
    return this.api.get<CloseDayReport>('reports/close-day', { date });
  }
  outOfStock(threshold = 0) {
    return this.api.get<Product[]>('reports/out-of-stock', { threshold });
  }
}

@Injectable({ providedIn: 'root' })
export class SyncApiService {
  private readonly api = inject(ApiService);

  status() {
    return this.api.get<SyncStatus>('sync/status');
  }
  runAll() {
    return this.api.post<SyncRunResult[]>('sync/run');
  }
  push(entity: string) {
    return this.api.post<SyncRunResult>(`sync/push/${entity}`);
  }
  pull(entity: string) {
    return this.api.post<SyncRunResult>(`sync/pull/${entity}`);
  }
}

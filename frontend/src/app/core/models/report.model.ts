import { Order, PaymentType } from './order.model';

export interface SalesTotals {
  orderCount: number;
  itemCount: number;
  totalSales: number;
  totalDiscount: number;
  amountPaid: number;
  byPaymentType: Record<PaymentType, number>;
}

export interface SalesReport extends SalesTotals {
  from: string;
  to: string;
  salesperson: string | null;
  orders: Order[];
}

export interface CloseDayReport extends SalesTotals {
  date: string;
  user: string;
}

export interface DashboardStats {
  date: string;
  mySalesToday: SalesTotals;
  storeSalesToday: SalesTotals | null;
  birthdaysToday: number;
  parkedSales: number;
  outOfStock: number;
  productCount: number;
}

export interface SyncRunResult {
  entity: string;
  direction: 'push' | 'pull';
  count: number;
  errors: { key?: string; message: string }[];
}

export interface SyncStatus {
  remoteConfigured: boolean;
  remoteUrl: string | null;
  cronEnabled: boolean;
  running: boolean;
  lastRun: { at: string; results: SyncRunResult[] } | null;
  pending: { entity: string; pending: number }[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface PageQuery {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface StoreInfo {
  /** Product name, e.g. "Graeville POS". */
  appName: string;
  /** The customer's store name, e.g. "Mecca Beauty". */
  name: string;
  address: string;
  phone: string;
  email: string;
  receiptFooter: string;
  currency: string;
}

/** Editable store details (Administration → Store settings). */
export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  receiptFooter: string;
  currency: string;
  updatedBy: string | null;
  updatedAt: string;
}

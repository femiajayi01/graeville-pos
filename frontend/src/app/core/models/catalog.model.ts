export interface Brand {
  id: number;
  name: string;
  brandNo: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  categoryNo: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  description: string | null;
  brandId: number | null;
  categoryId: number | null;
  brand?: Brand | null;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  name: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  description?: string | null;
  brandId?: number | null;
  categoryId?: number | null;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

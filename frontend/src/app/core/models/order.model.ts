import { Customer, CustomerPayload } from './customer.model';

export enum PaymentType {
  Cash = 'Cash',
  DebitCard = 'Debit Card',
  Transfer = 'Transfer',
}

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  barcode: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  salesperson: string;
  salespersonId: number | null;
  customerId: number | null;
  customerName: string | null;
  customer?: Customer | null;
  quantity: number;
  totalPrice: number;
  discount: number;
  amountPaid: number;
  paymentType: PaymentType;
  terminal: string | null;
  isReturned: boolean;
  returnedAt: string | null;
  returnedBy: string | null;
  items?: OrderItem[];
  createdAt: string;
}

export interface CartLine {
  productId: number;
  quantity: number;
}

export interface CheckoutPayload {
  items: CartLine[];
  paymentType: PaymentType;
  discount?: number;
  customerId?: number;
  newCustomer?: CustomerPayload;
  packingId?: number;
}

export interface PackedItem {
  productId: number;
  productName: string;
  barcode: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Packing {
  id: number;
  items: PackedItem[];
  totalQty: number;
  totalPrice: number;
  terminal: string;
  parkedBy: string;
  label: string | null;
  createdAt: string;
}

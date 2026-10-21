import { computed, effect, Injectable, signal } from '@angular/core';
import { CartLine, Packing, Product } from '@core/models';

export interface CartItem {
  productId: number;
  name: string;
  barcode: string | null;
  unitPrice: number;
  quantity: number;
  /** Units in stock when added; null when unknown (resumed parked sale). The API re-checks at checkout. */
  stock: number | null;
}

export type AddResult =
  { ok: true } | { ok: false; reason: 'out-of-stock' | 'limit'; available: number };

const STORAGE_KEY = 'pos.cart';

const toKobo = (n: number) => Math.round(n * 100);

/**
 * The cart for the sell screen. Replaces Laravel's session-based UserCart:
 * it lives in the browser (signals + localStorage, so a refresh doesn't lose a sale)
 * and is only sent to the API at checkout or when parking.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly state = signal<{ items: CartItem[]; packingId: number | null }>(this.restore());

  readonly items = computed(() => this.state().items);
  readonly packingId = computed(() => this.state().packingId);
  readonly isEmpty = computed(() => this.state().items.length === 0);
  readonly totalQty = computed(() => this.state().items.reduce((acc, i) => acc + i.quantity, 0));
  readonly totalPrice = computed(
    () => this.state().items.reduce((acc, i) => acc + toKobo(i.unitPrice) * i.quantity, 0) / 100,
  );

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state())));
  }

  add(product: Product, quantity = 1): AddResult {
    if (product.quantity <= 0) return { ok: false, reason: 'out-of-stock', available: 0 };
    const existing = this.items().find((i) => i.productId === product.id);
    const wanted = (existing?.quantity ?? 0) + quantity;
    if (wanted > product.quantity)
      return { ok: false, reason: 'limit', available: product.quantity };

    if (existing) {
      this.patch(product.id, {
        quantity: wanted,
        stock: product.quantity,
        unitPrice: product.sellingPrice,
      });
    } else {
      const item: CartItem = {
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        unitPrice: product.sellingPrice,
        quantity,
        stock: product.quantity,
      };
      // Newest first, like the Laravel cart (array_reverse).
      this.state.update((s) => ({ ...s, items: [item, ...s.items] }));
    }
    return { ok: true };
  }

  /** Sets a line quantity, capped to known stock. Returns the quantity actually applied. */
  setQuantity(productId: number, quantity: number): number {
    const item = this.items().find((i) => i.productId === productId);
    if (!item) return 0;
    const capped = Math.max(
      1,
      Math.min(Math.floor(quantity) || 1, item.stock ?? Number.MAX_SAFE_INTEGER),
    );
    this.patch(productId, { quantity: capped });
    return capped;
  }

  increment(productId: number): boolean {
    const item = this.items().find((i) => i.productId === productId);
    if (!item || (item.stock !== null && item.quantity >= item.stock)) return false;
    this.patch(productId, { quantity: item.quantity + 1 });
    return true;
  }

  decrement(productId: number): void {
    const item = this.items().find((i) => i.productId === productId);
    if (!item) return;
    if (item.quantity <= 1) this.remove(productId);
    else this.patch(productId, { quantity: item.quantity - 1 });
  }

  remove(productId: number): void {
    this.state.update((s) => ({ ...s, items: s.items.filter((i) => i.productId !== productId) }));
  }

  clear(): void {
    this.state.set({ items: [], packingId: null });
  }

  /** Loads a parked sale into the cart (Laravel: sellPacked). */
  loadPacking(packing: Packing): void {
    this.state.set({
      packingId: packing.id,
      items: packing.items.map((i) => ({
        productId: i.productId,
        name: i.productName,
        barcode: i.barcode,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        stock: null,
      })),
    });
  }

  lines(): CartLine[] {
    return this.items().map((i) => ({ productId: i.productId, quantity: i.quantity }));
  }

  private patch(productId: number, changes: Partial<CartItem>) {
    this.state.update((s) => ({
      ...s,
      items: s.items.map((i) => (i.productId === productId ? { ...i, ...changes } : i)),
    }));
  }

  private restore(): { items: CartItem[]; packingId: number | null } {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as {
        items?: CartItem[];
        packingId?: number | null;
      } | null;
      return {
        items: Array.isArray(saved?.items) ? saved.items : [],
        packingId: saved?.packingId ?? null,
      };
    } catch {
      return { items: [], packingId: null };
    }
  }
}

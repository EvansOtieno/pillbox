import type { RxClass } from "@/lib/domain/product-rules";

/*
 * Cart rules as pure functions (the Zustand store just calls these). The cart lives in the browser;
 * prices here are what the shopper saw, and place_order() re-checks every one of them.
 */

export const MAX_QTY = 99;
export const MAX_LINES = 50;

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  priceKes: number;
  rxClass: RxClass;
  categorySlug: string;
  qty: number;
}

export type CartProduct = Omit<CartItem, "qty">;

const clampQty = (qty: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(qty)));

/** Add a product (or more of it). Prescription-only items never enter the cart. */
export function addItem(items: readonly CartItem[], product: CartProduct, qty = 1): CartItem[] {
  if (product.rxClass === "prescription_only") return [...items];
  const existing = items.find((i) => i.productId === product.productId);
  if (existing) {
    return items.map((i) =>
      i.productId === product.productId ? { ...i, ...product, qty: clampQty(i.qty + qty) } : i,
    );
  }
  if (items.length >= MAX_LINES) return [...items];
  return [...items, { ...product, qty: clampQty(qty) }];
}

/** Set a quantity; 0 or less removes the line. */
export function setQty(items: readonly CartItem[], productId: number, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, productId);
  return items.map((i) => (i.productId === productId ? { ...i, qty: clampQty(qty) } : i));
}

export function removeItem(items: readonly CartItem[], productId: number): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}

/** After place_order reports price_changed: take the new price so the shopper can review it. */
export function updatePrice(items: readonly CartItem[], productId: number, priceKes: number): CartItem[] {
  return items.map((i) => (i.productId === productId ? { ...i, priceKes } : i));
}

export function itemCount(items: readonly CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function itemsTotal(items: readonly CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceKes * i.qty, 0);
}

/** The shape place_order() expects in p_items. */
export function toOrderLines(items: readonly CartItem[]) {
  return items.map((i) => ({ product_id: i.productId, qty: i.qty, unit_price_kes: i.priceKes }));
}

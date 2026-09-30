/**
 * Medicine rules (mirrored in place_order(), which has the final say):
 *   prescription_only → can't be bought online; "Consult pharmacist" instead; price may be hidden.
 *   pharmacy_only     → can be bought; a pharmacist confirms before dispatch (notice in cart/checkout).
 *   out of stock      → "Ask a pharmacist" instead of add-to-cart.
 */

export type RxClass = "general" | "pharmacy_only" | "prescription_only";

export interface RuleProduct {
  rx_class: RxClass;
  in_stock: boolean;
}

export type ProductAction =
  | { kind: "add_to_cart" }
  | { kind: "consult"; label: "Consult pharmacist"; messageKey: "consult_message" }
  | { kind: "ask"; label: "Ask a pharmacist"; messageKey: "stock_message" };

export const isRx = (p: RuleProduct) => p.rx_class === "prescription_only";
export const isPharmacyOnly = (p: RuleProduct) => p.rx_class === "pharmacy_only";

export function canBuyOnline(p: RuleProduct): boolean {
  return !isRx(p) && p.in_stock;
}

/** What the main button on a product card or page does. Prescription wins over stock. */
export function productAction(p: RuleProduct): ProductAction {
  if (isRx(p)) return { kind: "consult", label: "Consult pharmacist", messageKey: "consult_message" };
  if (!p.in_stock) return { kind: "ask", label: "Ask a pharmacist", messageKey: "stock_message" };
  return { kind: "add_to_cart" };
}

/** Hidden prices stay out of the HTML and the structured data (pharmacy advertising rules). */
export function showPrice(p: RuleProduct, hideRxPrice: boolean): boolean {
  return !(isRx(p) && hideRxPrice);
}

export function hasPharmacyOnly(items: readonly RuleProduct[]): boolean {
  return items.some(isPharmacyOnly);
}

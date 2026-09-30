import { formatMsisdnLocal } from "./contact";
import { formatKes } from "./money";
import type { RxClass } from "./product-rules";
import { fillTemplate } from "./template";

/** Keeps the wa.me URL well under browser/app limits for very large baskets. */
export const MAX_ITEM_LINES = 25;

/** The saved order, as returned by order_by_token(). */
export interface OrderForMessage {
  number: number;
  fulfilment: "delivery" | "pickup";
  delivery_area: string;
  delivery_fee_kes: number;
  items_total_kes: number;
  total_kes: number;
  customer_name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  items: ReadonlyArray<{ name: string; qty: number; line_total_kes: number; rx_class: RxClass }>;
}

export interface MessageSettings {
  store_name: string;
  store_address: string;
  order_intro: string;
}

/** Plain-text WhatsApp message the customer sends to the pharmacy after checkout. */
export function orderMessage(order: OrderForMessage, settings: MessageSettings): string {
  const lines = [fillTemplate(settings.order_intro, { store: settings.store_name, order: order.number }), ""];

  const shown = order.items.slice(0, MAX_ITEM_LINES);
  for (const item of shown) {
    const marker = item.rx_class === "pharmacy_only" ? "• (P) " : "• ";
    lines.push(`${marker}${item.qty} × ${item.name} – ${formatKes(item.line_total_kes)}`);
  }
  const hidden = order.items.length - shown.length;
  if (hidden > 0) {
    lines.push(`…and ${hidden} more ${hidden === 1 ? "item" : "items"} (see order #${order.number})`);
  }
  if (order.items.some((i) => i.rx_class === "pharmacy_only")) {
    lines.push("(P) = pharmacy-only: pharmacist to confirm");
  }

  const pickup = order.fulfilment === "pickup";
  lines.push("", `Items: ${formatKes(order.items_total_kes)}`);
  lines.push(
    pickup
      ? `Pick-up at ${settings.store_name}, ${settings.store_address}`
      : `Delivery (${order.delivery_area}): ${formatKes(order.delivery_fee_kes)}`,
  );
  lines.push(`${pickup ? "Total to pay at pick-up" : "Total to pay on delivery"}: ${formatKes(order.total_kes)}`);

  lines.push("", `Name: ${order.customer_name}`, `Phone: ${formatMsisdnLocal(order.phone)}`);
  if (!pickup && order.address) lines.push(`Deliver to: ${order.address}`);
  const notes = order.notes?.trim();
  if (notes) lines.push(`Notes: ${notes}`);

  return lines.join("\n");
}

/** Staff → customer: opening line for a WhatsApp chat about an order. */
export function customerGreeting(firstName: string, storeName: string, orderNumber: number): string {
  return `Hello ${firstName}, this is ${storeName} about your order #${orderNumber}.`;
}

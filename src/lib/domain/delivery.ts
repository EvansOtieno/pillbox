import { formatFee, formatKes } from "./money";

export interface DeliveryOption {
  id: number;
  name: string;
  fee_kes: number;
  is_pickup: boolean;
}

/** Pick-up first, then delivery areas from cheapest to dearest, then by name. */
export function sortDeliveryOptions<T extends DeliveryOption>(options: readonly T[]): T[] {
  return [...options].sort(
    (a, b) =>
      Number(b.is_pickup) - Number(a.is_pickup) || a.fee_kes - b.fee_kes || a.name.localeCompare(b.name),
  );
}

/** One line for tight spaces: "Free pick-up · Delivery from KES 150 (12 areas)". */
export function deliverySummary(options: readonly DeliveryOption[]): string {
  const delivery = options.filter((o) => !o.is_pickup);
  const parts: string[] = [];
  if (delivery.length < options.length) parts.push("Free pick-up");
  if (delivery.length > 0) {
    const lowest = Math.min(...delivery.map((o) => o.fee_kes));
    const areas = `${delivery.length} ${delivery.length === 1 ? "area" : "areas"}`;
    parts.push(`Delivery from ${formatKes(lowest)} (${areas})`);
  }
  return parts.join(" · ");
}

/** Plain-text list for search engines and FAQ tokens: "Pick-up in Kilimani: Free; Kilimani: KES 150; …". */
export function deliveryFeesText(options: readonly DeliveryOption[]): string {
  return sortDeliveryOptions(options)
    .map((o) => `${o.name}: ${formatFee(o.fee_kes)}`)
    .join("; ");
}

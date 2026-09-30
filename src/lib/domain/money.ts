/** Prices are stored as whole Kenyan shillings (int), never floats. */
export function formatKes(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`KES amounts must be whole shillings, got ${amount}`);
  }
  return `KES ${amount.toLocaleString("en-KE")}`;
}

/** Delivery fees: 0 reads as "Free". */
export function formatFee(amount: number): string {
  return amount === 0 ? "Free" : formatKes(amount);
}

/** Prices are stored as whole Kenyan shillings (int), never floats. */
export function formatKes(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`KES amounts must be whole shillings, got ${amount}`);
  }
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

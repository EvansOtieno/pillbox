/**
 * Order workflow for the admin buttons. Mirrors the database trigger check_order_status(),
 * which has the final say: new → confirmed → completed; new or confirmed → cancelled.
 */

export type OrderStatus = "new" | "confirmed" | "completed" | "cancelled";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** The steps of the normal path, in order (cancelled is an exit, not a step). */
export const STATUS_STEPS: OrderStatus[] = ["new", "confirmed", "completed"];

export interface StatusMove {
  to: OrderStatus;
  label: string;
  /** Ask before doing it. */
  confirm?: string;
}

export function nextMoves(status: OrderStatus): StatusMove[] {
  switch (status) {
    case "new":
      return [
        { to: "confirmed", label: "Mark as confirmed" },
        { to: "cancelled", label: "Cancel order", confirm: "Cancel this order? This can't be undone." },
      ];
    case "confirmed":
      return [
        { to: "completed", label: "Mark as completed" },
        { to: "cancelled", label: "Cancel order", confirm: "Cancel this order? This can't be undone." },
      ];
    default:
      return [];
  }
}

export function canMove(from: OrderStatus, to: OrderStatus): boolean {
  return nextMoves(from).some((m) => m.to === to);
}

/** Start of "today" in Nairobi (UTC+3, no daylight saving) as an ISO timestamp, for the dashboard. */
export function startOfNairobiDay(now: Date): string {
  const nairobi = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const midnightUtc = Date.UTC(nairobi.getUTCFullYear(), nairobi.getUTCMonth(), nairobi.getUTCDate()) - 3 * 60 * 60 * 1000;
  return new Date(midnightUtc).toISOString();
}

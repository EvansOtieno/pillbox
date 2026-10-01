"use server";

import { refresh } from "next/cache";
import { failed, fromDbError, saved, type ActionResult } from "@/lib/admin/action-result";
import { requireStaff } from "@/lib/admin/auth";
import { STATUS_LABEL, canMove, type OrderStatus } from "@/lib/domain/order-status";

/** Move an order along the workflow. Bound to the order id and target status by the page. */
export async function changeOrderStatus(
  orderId: string,
  to: OrderStatus,
  _prev: ActionResult | null,
  _form: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const { data: order, error: readError } = await supabase.from("orders").select("status").eq("id", orderId).single();
  if (readError || !order) return failed("This order no longer exists.");
  if (!canMove(order.status, to)) {
    return failed(`An order that is ${STATUS_LABEL[order.status].toLowerCase()} can't be marked ${STATUS_LABEL[to].toLowerCase()}.`);
  }
  // RLS allows staff to update only the status column; the trigger re-checks the move.
  const { error } = await supabase.from("orders").update({ status: to }).eq("id", orderId);
  if (error) return fromDbError(error);
  refresh();
  return saved(`Marked ${STATUS_LABEL[to].toLowerCase()}`);
}

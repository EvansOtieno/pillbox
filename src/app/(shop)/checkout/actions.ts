"use server";

import { z } from "zod";
import { MAX_LINES, MAX_QTY } from "@/lib/cart/cart-logic";
import { ORDER_ERRORS, checkoutFieldErrors, checkoutSchema } from "@/lib/domain/checkout";
import { createPublicClient } from "@/lib/supabase/public";

/*
 * Server Action: like a @PostMapping handler, but called directly from the checkout form.
 * It is a public HTTP endpoint, so it trusts nothing: the form is validated here with the same zod
 * schema the browser used, and place_order() in the database re-checks every rule and price.
 */

export type PlaceOrderState =
  | { status: "idle" }
  | { status: "placed"; token: string }
  | {
      status: "error";
      message: string;
      fieldErrors: Record<string, string>;
      /** place_order() reported a new price: the cart takes it so the shopper can review. */
      priceUpdate?: { productId: number; priceKes: number };
      /** An item can't be ordered any more (out of stock, prescription-only, removed). */
      blockedProductId?: number;
    };

const orderLines = z
  .array(
    z.object({
      product_id: z.number().int().positive(),
      qty: z.number().int().min(1).max(MAX_QTY),
      unit_price_kes: z.number().int().min(0),
    }),
  )
  .min(1)
  .max(MAX_LINES);

export async function placeOrder(_prev: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  const values = {
    customer_name: formData.get("customer_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    fulfilment: formData.get("fulfilment") ?? undefined,
    delivery_area_id: formData.get("delivery_area_id") ?? undefined,
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  };
  const form = checkoutSchema.safeParse(values);
  if (!form.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: checkoutFieldErrors(values) };
  }

  let lines: z.infer<typeof orderLines>;
  try {
    lines = orderLines.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    return { status: "error", message: ORDER_ERRORS.empty_cart, fieldErrors: {} };
  }

  const { data, error } = await createPublicClient()
    .rpc("place_order", {
      p_customer_name: form.data.customer_name,
      p_phone: form.data.phone,
      p_email: form.data.email ?? "",
      p_delivery_area_id: form.data.delivery_area_id,
      p_address: form.data.address,
      p_notes: form.data.notes,
      p_items: lines,
    })
    .single();

  if (error || !data) {
    const code = error?.message ?? "";
    if (!(code in ORDER_ERRORS)) {
      console.error("place_order failed", error);
      return { status: "error", message: "We couldn't save your order. Please try again.", fieldErrors: {} };
    }
    // DETAIL from the database is already a friendly sentence, often naming the product.
    const state: PlaceOrderState = { status: "error", message: error?.details || ORDER_ERRORS[code], fieldErrors: {} };
    if (code === "price_changed" && error?.hint) {
      const hint = JSON.parse(error.hint) as { product_id: number; price_kes: number };
      state.priceUpdate = { productId: hint.product_id, priceKes: hint.price_kes };
    }
    if (["product_unavailable", "out_of_stock", "prescription_only"].includes(code) && error?.hint) {
      state.blockedProductId = Number(error.hint);
    }
    const field = FIELD_FOR_CODE[code];
    if (field) state.fieldErrors[field] = ORDER_ERRORS[code];
    return state;
  }

  return { status: "placed", token: data.public_token };
}

const FIELD_FOR_CODE: Record<string, string> = {
  invalid_name: "customer_name",
  invalid_phone: "phone",
  invalid_email: "email",
  unknown_area: "delivery_area_id",
  address_required: "address",
};

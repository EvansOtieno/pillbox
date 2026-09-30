import { z } from "zod";
import { normaliseMsisdn } from "./contact";

/**
 * Checkout form validation (the friendly first line of defence; place_order() re-checks everything).
 * Short form for a pay-on-delivery pharmacy in Nairobi: name, Kenyan mobile, optional email,
 * delivery area or pick-up, address only for delivery, notes.
 */
export const checkoutSchema = z
  .object({
    customer_name: z.string().trim().min(2, "Please enter your name.").max(100),
    phone: z
      .string()
      .trim()
      .transform((v, ctx) => {
        const msisdn = normaliseMsisdn(v);
        if (!msisdn) {
          ctx.addIssue({ code: "custom", message: "Please enter a Kenyan mobile number, e.g. 0712 345 678." });
          return z.NEVER;
        }
        return msisdn;
      }),
    email: z
      .union([z.literal(""), z.email("Please enter a valid email address.").max(200)])
      .optional()
      .transform((v) => v || undefined),
    fulfilment: z.enum(["delivery", "pickup"], { error: "Please choose delivery or pick-up." }),
    delivery_area_id: z.coerce.number({ error: "Please choose a delivery area." }).int().positive(),
    address: z.string().trim().max(300).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.fulfilment === "delivery" && v.address === "") {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Please enter a delivery address, or choose pick-up." });
    }
  })
  .transform((v) => ({ ...v, address: v.fulfilment === "pickup" ? "" : v.address }));

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

/** Friendly text for place_order() error codes (the `message` field of the database error). */
export const ORDER_ERRORS: Record<string, string> = {
  invalid_name: "Please enter your name.",
  invalid_phone: "Please enter a Kenyan mobile number, e.g. 0712 345 678.",
  invalid_email: "Please enter a valid email address.",
  text_too_long: "Your address or notes are too long.",
  unknown_area: "Please choose a delivery area or pick-up.",
  address_required: "Please enter a delivery address, or choose pick-up.",
  empty_cart: "Your cart is empty.",
  too_many_lines: "Please order at most 50 different items.",
  product_unavailable: "An item in your cart is no longer available.",
  invalid_qty: "Please choose a quantity between 1 and 99.",
  prescription_only: "A medicine in your cart needs a prescription. Please consult our pharmacist.",
  out_of_stock: "An item in your cart is out of stock.",
  price_changed: "A price in your cart has changed. Please review your cart.",
};

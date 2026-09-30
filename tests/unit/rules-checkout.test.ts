// Ported from the WordPress build's tests/m2-rules.php (product rules and checkout validation).
import { describe, expect, it } from "vitest";
import { canBuyOnline, hasPharmacyOnly, productAction, showPrice } from "@/lib/domain/product-rules";
import { checkoutFieldErrors, checkoutSchema } from "@/lib/domain/checkout";

const general = { rx_class: "general", in_stock: true } as const;
const outOfStock = { rx_class: "general", in_stock: false } as const;
const pharmacyOnly = { rx_class: "pharmacy_only", in_stock: true } as const;
const rx = { rx_class: "prescription_only", in_stock: true } as const;

describe("product rules", () => {
  it("normal product can be bought", () => {
    expect(canBuyOnline(general)).toBe(true);
    expect(productAction(general)).toEqual({ kind: "add_to_cart" });
  });

  it("prescription product can't be bought: Consult pharmacist", () => {
    expect(canBuyOnline(rx)).toBe(false);
    expect(productAction(rx)).toMatchObject({ kind: "consult", label: "Consult pharmacist" });
  });

  it("prescription wins over out of stock", () => {
    expect(productAction({ ...rx, in_stock: false }).kind).toBe("consult");
  });

  it("out of stock: Ask a pharmacist", () => {
    expect(canBuyOnline(outOfStock)).toBe(false);
    expect(productAction(outOfStock)).toMatchObject({ kind: "ask", label: "Ask a pharmacist" });
  });

  it("pharmacy-only product can be bought and is flagged", () => {
    expect(canBuyOnline(pharmacyOnly)).toBe(true);
    expect(hasPharmacyOnly([general, pharmacyOnly])).toBe(true);
    expect(hasPharmacyOnly([general])).toBe(false);
  });

  it("hides prescription prices only when the setting says so", () => {
    expect(showPrice(rx, true)).toBe(false);
    expect(showPrice(rx, false)).toBe(true);
    expect(showPrice(general, true)).toBe(true);
  });
});

describe("checkout validation", () => {
  const base = { customer_name: "Test Customer", phone: "0712 345 678", fulfilment: "delivery", delivery_area_id: "3" };
  const errorsFor = (input: Record<string, unknown>) => {
    const result = checkoutSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
  };

  it("bad phone rejected", () => {
    expect(errorsFor({ ...base, phone: "12345", address: "x" })).toContain("phone");
  });

  it("Kenyan phone accepted and normalised", () => {
    const result = checkoutSchema.parse({ ...base, address: "Brookside Grove" });
    expect(result.phone).toBe("254712345678");
    expect(result.delivery_area_id).toBe(3);
  });

  it("delivery without address rejected", () => {
    expect(errorsFor(base)).toEqual(["address"]);
  });

  it("pick-up without address accepted, and any address is dropped", () => {
    expect(errorsFor({ ...base, fulfilment: "pickup" })).toEqual([]);
    expect(checkoutSchema.parse({ ...base, fulfilment: "pickup", address: "ignored" }).address).toBe("");
  });

  it("email is optional but must be valid when given", () => {
    expect(checkoutSchema.parse({ ...base, address: "x", email: "" }).email).toBeUndefined();
    expect(errorsFor({ ...base, address: "x", email: "not an email" })).toContain("email");
  });
});

describe("checkoutFieldErrors", () => {
  it("reports every problem in one round, including the address", () => {
    expect(Object.keys(checkoutFieldErrors({ fulfilment: "delivery" })).sort()).toEqual(
      ["address", "customer_name", "delivery_area_id", "phone"].sort(),
    );
  });

  it("does not ask for an address on pick-up", () => {
    expect(checkoutFieldErrors({ fulfilment: "pickup" })).not.toHaveProperty("address");
  });
});

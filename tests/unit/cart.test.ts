import { describe, expect, it } from "vitest";
import {
  MAX_LINES,
  addItem,
  itemCount,
  itemsTotal,
  removeItem,
  setQty,
  toOrderLines,
  updatePrice,
  type CartProduct,
} from "@/lib/cart/cart-logic";

const product = (id: number, price = 100, rxClass: CartProduct["rxClass"] = "general"): CartProduct => ({
  productId: id,
  slug: `p-${id}`,
  name: `Product ${id}`,
  priceKes: price,
  rxClass,
  categorySlug: "pain-fever",
});

describe("cart", () => {
  it("adds a product and merges repeats", () => {
    let items = addItem([], product(1, 120));
    items = addItem(items, product(1, 120), 2);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(3);
  });

  it("never adds prescription-only products", () => {
    expect(addItem([], product(1, 100, "prescription_only"))).toEqual([]);
  });

  it("keeps quantities between 1 and 99", () => {
    let items = addItem([], product(1), 150);
    expect(items[0].qty).toBe(99);
    items = setQty(items, 1, 0);
    expect(items).toEqual([]);
  });

  it(`caps the cart at ${MAX_LINES} different products`, () => {
    let items = addItem([], product(1));
    for (let id = 2; id <= MAX_LINES; id++) items = addItem(items, product(id));
    items = addItem(items, product(999));
    expect(items).toHaveLength(MAX_LINES);
  });

  it("counts, totals and removes", () => {
    const items = addItem(addItem([], product(1, 120), 2), product(2, 450));
    expect(itemCount(items)).toBe(3);
    expect(itemsTotal(items)).toBe(690);
    expect(itemsTotal(removeItem(items, 1))).toBe(450);
  });

  it("takes a changed price from the server", () => {
    const items = updatePrice(addItem([], product(1, 120)), 1, 150);
    expect(itemsTotal(items)).toBe(150);
  });

  it("builds place_order lines", () => {
    expect(toOrderLines(addItem([], product(7, 300), 2))).toEqual([{ product_id: 7, qty: 2, unit_price_kes: 300 }]);
  });
});

// Ported from the WordPress build's tests/m2-rules.php (WhatsApp order hand-off).
import { describe, expect, it } from "vitest";
import { MAX_ITEM_LINES, customerGreeting, orderMessage, type OrderForMessage } from "@/lib/domain/whatsapp-message";
import { whatsappUrl } from "@/lib/domain/contact";
import { defaultSettings } from "@/lib/settings/schema";

const items = [
  { name: "Vitamin C 1000mg Effervescent Tablets 20s", qty: 2, line_total_kes: 1700, rx_class: "general" },
  { name: "Hydrocortisone 1% Cream 15g", qty: 1, line_total_kes: 450, rx_class: "pharmacy_only" },
] as const;

const delivery: OrderForMessage = {
  number: 1042,
  fulfilment: "delivery",
  delivery_area: "Westlands",
  delivery_fee_kes: 300,
  items_total_kes: 2150,
  total_kes: 2450,
  customer_name: "Test Customer",
  phone: "254712345678",
  address: "Brookside Grove, Westlands, Apt 4B",
  notes: "Call on arrival & ring twice",
  items: [...items],
};

const pickup: OrderForMessage = {
  ...delivery,
  fulfilment: "pickup",
  delivery_area: "Pick-up in Kilimani",
  delivery_fee_kes: 0,
  total_kes: 2150,
  address: null,
};

describe("orderMessage: delivery", () => {
  const msg = orderMessage(delivery, defaultSettings);

  it("intro has store and order number", () => {
    expect(msg.split("\n")[0]).toBe("Hello Afya Corner, I would like to confirm my order #1042.");
  });

  it("line item with qty and total", () => {
    expect(msg).toContain("• 2 × Vitamin C 1000mg Effervescent Tablets 20s – KES 1,700");
  });

  it("pharmacy-only item marked, with a legend", () => {
    expect(msg).toContain("• (P) 1 × Hydrocortisone");
    expect(msg).toContain("(P) = pharmacy-only: pharmacist to confirm");
  });

  it("delivery area, fee and total", () => {
    expect(msg).toContain("Items: KES 2,150");
    expect(msg).toContain("Delivery (Westlands): KES 300");
    expect(msg).toContain("Total to pay on delivery: KES 2,450");
  });

  it("customer details", () => {
    expect(msg).toContain("Phone: 0712 345 678");
    expect(msg).toContain("Deliver to: Brookside Grove, Westlands, Apt 4B");
    expect(msg).toContain("Notes: Call on arrival & ring twice");
  });

  it("URL fully encoded: line breaks kept, no raw & in the text", () => {
    const url = whatsappUrl("254700000000", msg);
    const text = url.slice(url.indexOf("?text=") + 6);
    expect(text).toContain("%0A");
    expect(text).toContain("%26");
    expect(text).not.toContain("&");
  });
});

describe("orderMessage: pick-up", () => {
  const msg = orderMessage(pickup, defaultSettings);

  it("pick-up line uses the store name and address", () => {
    expect(msg).toContain("Pick-up at Afya Corner, Afya Plaza, Kilimani, Nairobi");
  });

  it("pick-up total wording", () => {
    expect(msg).toContain("Total to pay at pick-up: KES 2,150");
  });

  it("no delivery address", () => {
    expect(msg).not.toContain("Deliver to");
  });
});

describe("orderMessage: large baskets", () => {
  it(`lists at most ${MAX_ITEM_LINES} items, then a count`, () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      name: `Item ${i + 1}`,
      qty: 1,
      line_total_kes: 100,
      rx_class: "general" as const,
    }));
    const msg = orderMessage({ ...delivery, items: many }, defaultSettings);
    expect(msg).toContain(`• 1 × Item ${MAX_ITEM_LINES} –`);
    expect(msg).not.toContain(`Item ${MAX_ITEM_LINES + 1} `);
    expect(msg).toContain("…and 5 more items (see order #1042)");
    expect(msg).not.toContain("(P) =");
  });
});

describe("customerGreeting", () => {
  it("staff opening line", () => {
    expect(customerGreeting("Test", "Afya Corner", 1042)).toBe(
      "Hello Test, this is Afya Corner about your order #1042.",
    );
  });
});

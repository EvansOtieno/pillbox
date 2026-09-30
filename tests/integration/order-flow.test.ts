// End-to-end data flow through the real API (PostgREST + RLS), as the storefront will use it.
// Needs the local stack: pnpm db:start (and a fresh seed: pnpm db:reset). Run: pnpm test:integration
import { beforeAll, describe, expect, it } from "vitest";
import { createPublicClient } from "@/lib/supabase/public";
import { settingsFromRows, type Settings } from "@/lib/settings/schema";
import { orderMessage, type OrderForMessage } from "@/lib/domain/whatsapp-message";
import { whatsappUrl } from "@/lib/domain/contact";
import { ORDER_ERRORS } from "@/lib/domain/checkout";

const db = createPublicClient();
let settings: Settings;

beforeAll(async () => {
  const { data, error } = await db.from("settings").select("key, value");
  expect(error).toBeNull();
  settings = settingsFromRows(data ?? []);
});

describe("storefront reads (anon)", () => {
  it("loads settings from the database", () => {
    expect(settings.store_name).toBe("Afya Corner");
    expect(settings.about_text).toContain("Kilimani");
  });

  it("lists categories with product counts", async () => {
    const { data, error } = await db
      .from("categories")
      .select("slug, name, products(count)")
      .order("sort_order");
    expect(error).toBeNull();
    expect(data).toHaveLength(6);
    const total = data!.reduce((sum, c) => sum + (c.products[0]?.count ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(150);
  });

  it("cannot read orders", async () => {
    const { error } = await db.from("orders").select("id").limit(1);
    expect(error?.code).toBe("42501");
  });
});

describe("placing an order", () => {
  async function product(filter: { rx_class: "general" | "prescription_only"; in_stock: boolean }) {
    const { data } = await db
      .from("products")
      .select("id, name, price_kes")
      .eq("rx_class", filter.rx_class)
      .eq("in_stock", filter.in_stock)
      .order("id")
      .limit(1)
      .single();
    return data!;
  }

  it("saves the order and builds the WhatsApp hand-off", async () => {
    const item = await product({ rx_class: "general", in_stock: true });
    const { data: area } = await db.from("delivery_areas").select("id, fee_kes").eq("name", "Kilimani").single();

    const { data: placed, error } = await db
      .rpc("place_order", {
        p_customer_name: "Integration Test",
        p_phone: "0712 345 678",
        p_email: "",
        p_delivery_area_id: area!.id,
        p_address: "Kindaruma Road",
        p_notes: "Leave at the gate & call",
        p_items: [{ product_id: item.id, qty: 2, unit_price_kes: item.price_kes }],
      })
      .single();
    expect(error).toBeNull();
    expect(placed!.order_number).toBeGreaterThanOrEqual(1001);

    const { data: order } = await db.rpc("order_by_token", { p_token: placed!.public_token });
    const saved = order as unknown as OrderForMessage;
    expect(saved.total_kes).toBe(item.price_kes * 2 + area!.fee_kes);

    const url = whatsappUrl(settings.whatsapp_number, orderMessage(saved, settings));
    expect(url).toContain(encodeURIComponent(`2 × ${item.name}`));
    expect(url).toContain("%0A");
  });

  it("returns a machine-readable reason when a rule is broken", async () => {
    const rx = await product({ rx_class: "prescription_only", in_stock: true });
    const { data: pickup } = await db.from("delivery_areas").select("id").eq("is_pickup", true).limit(1).single();

    const { error } = await db.rpc("place_order", {
      p_customer_name: "Integration Test",
      p_phone: "0712345678",
      p_email: "",
      p_delivery_area_id: pickup!.id,
      p_address: "",
      p_notes: "",
      p_items: [{ product_id: rx.id, qty: 1, unit_price_kes: rx.price_kes }],
    });
    expect(error?.code).toBe("P0001");
    expect(error?.message).toBe("prescription_only");
    expect(error?.hint).toBe(String(rx.id));
    expect(ORDER_ERRORS[error!.message]).toBeDefined();
  });
});

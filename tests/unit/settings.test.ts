// Ported from the WordPress build's tests/core-helpers.php and m3-sections.php (Settings::sanitize).
import { describe, expect, it } from "vitest";
import { defaultSettings, settingsFromRows, settingsSchema } from "@/lib/settings/schema";
import { fillTemplate } from "@/lib/domain/template";

describe("settingsSchema (saving from the admin)", () => {
  it("normalises the WhatsApp number", () => {
    expect(settingsSchema.parse({ whatsapp_number: "0712 345 678" }).whatsapp_number).toBe("254712345678");
  });

  it("drops invalid days", () => {
    expect(settingsSchema.parse({ open_days: [1, 2, 9] }).open_days).toEqual([1, 2]);
  });

  it("rejects an invalid WhatsApp number", () => {
    expect(settingsSchema.safeParse({ whatsapp_number: "bad" }).success).toBe(false);
  });

  it("rejects closing before opening", () => {
    expect(settingsSchema.safeParse({ open_time: "20:00", close_time: "08:00" }).success).toBe(false);
  });

  it("clamps the featured count to 0–24", () => {
    expect(settingsSchema.parse({ featured_count: "99" }).featured_count).toBe(24);
    expect(settingsSchema.parse({ featured_count: -3 }).featured_count).toBe(0);
  });

  it("only accepts https map links and real emails", () => {
    expect(settingsSchema.safeParse({ maps_url: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ public_email: "not an email" }).success).toBe(false);
    expect(settingsSchema.parse({ maps_url: "", public_email: "" }).maps_url).toBe("");
  });

  it("splits trust points into non-empty lines", () => {
    expect(settingsSchema.parse({ trust_points: ["One", " ", "Two"] }).trust_points).toEqual(["One", "Two"]);
    expect(defaultSettings.trust_points).toHaveLength(3);
  });
});

describe("settingsFromRows (reading from the database)", () => {
  it("fills missing keys with defaults and ignores unknown keys", () => {
    const s = settingsFromRows([{ key: "store_name", value: "Test Shop" }, { key: "nope", value: 1 }]);
    expect(s.store_name).toBe("Test Shop");
    expect(s.open_time).toBe(defaultSettings.open_time);
    expect("nope" in s).toBe(false);
  });

  it("keeps the default when a stored value is invalid", () => {
    expect(settingsFromRows([{ key: "whatsapp_number", value: "bad" }]).whatsapp_number).toBe("254700000000");
  });

  it("falls back to default hours as a pair when close <= open", () => {
    const s = settingsFromRows([
      { key: "open_time", value: "20:00" },
      { key: "close_time", value: "08:00" },
    ]);
    expect([s.open_time, s.close_time]).toEqual([defaultSettings.open_time, defaultSettings.close_time]);
  });
});

describe("fillTemplate", () => {
  it("replaces known placeholders and leaves unknown ones visible", () => {
    expect(fillTemplate("Hello {store}, about {product} {oops}", { store: "Afya Corner", product: "Zinc" })).toBe(
      "Hello Afya Corner, about Zinc {oops}",
    );
  });
});

// Ported from the WordPress build's tests/m3-sections.php.
import { describe, expect, it } from "vitest";
import { dayRanges, formatTime, hoursLine, openStatus } from "@/lib/domain/hours";
import { deliveryFeesText, deliverySummary, sortDeliveryOptions } from "@/lib/domain/delivery";
import { faqParts, faqPlainText, faqSchema } from "@/lib/domain/faq";

describe("dayRanges", () => {
  it.each([
    [[1, 2, 3, 4, 5, 6, 7], "Mon–Sun"],
    [[7, 1, 2, 3, 4, 5], "Mon–Fri, Sun"],
    [[1, 3, 5], "Mon, Wed, Fri"],
    [[], ""],
    [[6, 6, 7, 9], "Sat–Sun"],
  ])("%j → %j", (days, expected) => {
    expect(dayRanges(days)).toBe(expected);
  });
});

describe("formatTime / hoursLine", () => {
  it("uses 12-hour clock", () => {
    expect(formatTime("08:30")).toBe("8:30 AM");
    expect(formatTime("20:00")).toBe("8:00 PM");
    expect(formatTime("00:15")).toBe("12:15 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("builds the hours line", () => {
    expect(hoursLine({ days: [1, 2, 3, 4, 5, 6, 7], open: "08:30", close: "20:00" })).toBe(
      "Mon–Sun 8:30 AM – 8:00 PM",
    );
  });
});

describe("openStatus", () => {
  const weekdays = { days: [1, 2, 3, 4, 5], open: "08:00", close: "21:00" };
  const nairobi = (local: string) => new Date(`${local}:00+03:00`);

  it.each([
    ["2026-09-23T12:00", true, "Open until 9:00 PM"], // Wednesday midday
    ["2026-09-23T07:15", false, "Closed. Opens today at 8:00 AM"],
    ["2026-09-23T21:00", false, "Closed. Opens tomorrow at 8:00 AM"],
    ["2026-09-25T22:00", false, "Closed. Opens Monday at 8:00 AM"], // Friday night
    ["2026-09-27T10:00", false, "Closed. Opens tomorrow at 8:00 AM"], // Sunday
  ])("%s → %s, %s", (local, open, label) => {
    expect(openStatus(weekdays, nairobi(local))).toEqual({ open, label });
  });

  it("says Closed when no days are set", () => {
    expect(openStatus({ ...weekdays, days: [] }, nairobi("2026-09-23T12:00")).label).toBe("Closed");
  });
});

const areas = [
  { id: 3, name: "Westlands", fee_kes: 300, is_pickup: false },
  { id: 1, name: "Kilimani", fee_kes: 150, is_pickup: false },
  { id: 9, name: "Pick-up in Kilimani", fee_kes: 0, is_pickup: true },
  { id: 4, name: "Lavington", fee_kes: 450, is_pickup: false },
  { id: 2, name: "Hurlingham", fee_kes: 150, is_pickup: false },
];

describe("delivery options", () => {
  it("lists pick-up first, then fees ascending (name breaks ties)", () => {
    expect(sortDeliveryOptions(areas).map((a) => a.name)).toEqual([
      "Pick-up in Kilimani",
      "Hurlingham",
      "Kilimani",
      "Westlands",
      "Lavington",
    ]);
  });

  it("summarises free pick-up and the lowest fee", () => {
    expect(deliverySummary(areas)).toBe("Free pick-up · Delivery from KES 150 (4 areas)");
    expect(deliverySummary(areas.filter((a) => !a.is_pickup).slice(0, 1))).toBe("Delivery from KES 300 (1 area)");
    expect(deliverySummary([])).toBe("");
  });

  it("writes fees as text with pick-up as Free (no duplicate '(free)')", () => {
    const text = deliveryFeesText(areas);
    expect(text.startsWith("Pick-up in Kilimani: Free; Hurlingham: KES 150")).toBe(true);
    expect(text).toContain("Westlands: KES 300");
    expect(text.toLowerCase()).not.toContain("(free)");
  });
});

describe("FAQ tokens", () => {
  const tokens = { "{delivery_fees}": "Kilimani: KES 150", "{hours}": "Mon–Sun 8:00 AM – 9:00 PM" };

  it("pulls tokens out as blocks, never inside a paragraph", () => {
    expect(faqParts("Our fees:\n{delivery_fees}\n\nAsk us anything.")).toEqual([
      { type: "text", text: "Our fees:" },
      { type: "token", token: "{delivery_fees}" },
      { type: "text", text: "Ask us anything." },
    ]);
  });

  it("splits paragraphs on blank lines", () => {
    expect(faqParts("One.\n\nTwo.")).toEqual([
      { type: "text", text: "One." },
      { type: "text", text: "Two." },
    ]);
  });

  it("replaces tokens with plain text", () => {
    expect(faqPlainText("We are open {hours}.", tokens)).toBe("We are open Mon–Sun 8:00 AM – 9:00 PM.");
  });

  it("builds FAQPage structured data without tokens or HTML", () => {
    const schema = faqSchema([{ question: "How much is delivery?", answer: "{delivery_fees}" }], tokens);
    const json = JSON.stringify(schema);
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe("Kilimani: KES 150");
    expect(json).not.toContain("{delivery_fees}");
    expect(json).not.toContain("<");
  });
});

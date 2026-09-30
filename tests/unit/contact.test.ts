// Ported from the WordPress build's tests/core-helpers.php (same inputs, same expectations).
import { describe, expect, it } from "vitest";
import { formatMsisdnLocal, isOpen, normaliseMsisdn, shopNow, telUrl, whatsappUrl } from "@/lib/domain/contact";

describe("normaliseMsisdn", () => {
  it.each([
    ["0712 345 678", "254712345678"],
    ["+254 110 123456", "254110123456"],
    ["712345678", "254712345678"],
    ["254712345678", "254712345678"],
    ["0110-123-456", "254110123456"],
  ])("%s → %s", (input, expected) => {
    expect(normaliseMsisdn(input)).toBe(expected);
  });

  it.each(["020 1234567", "abc", "", "0812 345 678", "2547123456789"])("rejects %j", (input) => {
    expect(normaliseMsisdn(input)).toBeNull();
  });
});

describe("formatMsisdnLocal", () => {
  it("formats for display", () => {
    expect(formatMsisdnLocal("254712345678")).toBe("0712 345 678");
    expect(formatMsisdnLocal("not a number")).toBe("not a number");
  });
});

describe("whatsappUrl", () => {
  it("is fully encoded, including & and line breaks", () => {
    expect(whatsappUrl("254700000000", "A & B\nC")).toBe("https://wa.me/254700000000?text=A%20%26%20B%0AC");
  });

  it("has no text parameter for an empty message", () => {
    expect(whatsappUrl("254700000000")).toBe("https://wa.me/254700000000");
  });
});

describe("telUrl", () => {
  it("uses the international form for Kenyan mobiles", () => {
    expect(telUrl("0700 000 000")).toBe("tel:+254700000000");
  });

  it("keeps digits of other numbers", () => {
    expect(telUrl("+254 20 123 4567")).toBe("tel:+254201234567");
  });
});

describe("isOpen (Nairobi time, open inclusive, close exclusive)", () => {
  const hours = { days: [1, 2, 3, 4, 5, 6, 7], open: "08:30", close: "20:00" };
  const nairobi = (local: string) => new Date(`${local}:00+03:00`);

  it.each([
    ["2026-09-23T08:30", true],
    ["2026-09-23T08:29", false],
    ["2026-09-23T19:59", true],
    ["2026-09-23T20:00", false],
  ])("Wed %s → %s", (local, open) => {
    expect(isOpen(hours, nairobi(local))).toBe(open);
  });

  it("is closed on a day that isn't listed", () => {
    // 2026-09-27 is a Sunday
    expect(isOpen({ ...hours, days: [1, 2, 3, 4, 5, 6] }, nairobi("2026-09-27T12:00"))).toBe(false);
  });

  it("uses shop time, not the instant's UTC date", () => {
    // 22:30 UTC on Tuesday is 01:30 on Wednesday in Nairobi
    expect(shopNow(new Date("2026-09-22T22:30:00Z"))).toEqual({ day: 3, time: "01:30" });
  });
});

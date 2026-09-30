import { describe, expect, it } from "vitest";
import { formatFee, formatKes } from "@/lib/domain/money";

describe("formatKes", () => {
  it("formats whole shillings with thousands separators", () => {
    expect(formatKes(0)).toBe("KES 0");
    expect(formatKes(450)).toBe("KES 450");
    expect(formatKes(12500)).toBe("KES 12,500");
  });

  it("rejects fractional amounts", () => {
    expect(() => formatKes(99.5)).toThrow(RangeError);
  });
});

describe("formatFee", () => {
  it("shows a zero fee as Free", () => {
    expect(formatFee(0)).toBe("Free");
    expect(formatFee(300)).toBe("KES 300");
  });
});

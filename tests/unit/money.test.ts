import { describe, expect, it } from "vitest";
import { formatKes } from "@/lib/domain/money";

describe("formatKes", () => {
  it("formats whole shillings with thousands separators", () => {
    expect(formatKes(0)).toBe("KSh 0");
    expect(formatKes(450)).toBe("KSh 450");
    expect(formatKes(12500)).toBe("KSh 12,500");
  });

  it("rejects fractional amounts", () => {
    expect(() => formatKes(99.5)).toThrow(RangeError);
  });
});

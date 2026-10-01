import { describe, expect, it } from "vitest";
import { canMove, nextMoves, startOfNairobiDay } from "@/lib/domain/order-status";

describe("order workflow", () => {
  it("new orders can be confirmed or cancelled", () => {
    expect(nextMoves("new").map((m) => m.to)).toEqual(["confirmed", "cancelled"]);
  });

  it("confirmed orders can be completed or cancelled", () => {
    expect(nextMoves("confirmed").map((m) => m.to)).toEqual(["completed", "cancelled"]);
  });

  it("completed and cancelled orders are final", () => {
    expect(nextMoves("completed")).toEqual([]);
    expect(nextMoves("cancelled")).toEqual([]);
    expect(canMove("completed", "new")).toBe(false);
  });

  it("can't skip confirmation", () => {
    expect(canMove("new", "completed")).toBe(false);
  });

  it("asks before cancelling", () => {
    expect(nextMoves("new").find((m) => m.to === "cancelled")?.confirm).toBeTruthy();
  });
});

describe("startOfNairobiDay", () => {
  it("is midnight Nairobi time (21:00 UTC the day before)", () => {
    expect(startOfNairobiDay(new Date("2026-09-30T10:00:00Z"))).toBe("2026-09-29T21:00:00.000Z");
  });

  it("rolls over at 21:00 UTC", () => {
    expect(startOfNairobiDay(new Date("2026-09-30T21:30:00Z"))).toBe("2026-09-30T21:00:00.000Z");
  });
});

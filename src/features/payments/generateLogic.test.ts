import { describe, it, expect } from "vitest";
import { buildMissingPayments } from "./generateLogic";

const fixedNow = new Date("2025-01-15T12:00:00Z");

describe("buildMissingPayments", () => {
  it("returns empty when no rooms", () => {
    const rows = buildMissingPayments("2025-03", [], []);
    expect(rows).toHaveLength(0);
  });

  it("skips rooms already having payments", () => {
    const rows = buildMissingPayments(
      "2025-03",
      [
        { id: "r1", rent_price: 1000, due_day: 10, status: "occupied" },
        { id: "r2", rent_price: 1200, due_day: 12, status: "occupied" },
      ],
      ["r1"],
      fixedNow
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].room_id).toBe("r2");
  });

  it("bounds due_day to between 1 and 31 (capped to month length) and defaults when missing", () => {
    const rows = buildMissingPayments(
      "2025-02",
      [
        { id: "a", rent_price: 500, due_day: 0, status: "occupied" },
        { id: "b", rent_price: 500, due_day: 35, status: "occupied" },
        { id: "c", rent_price: 500, due_day: 15, status: "occupied" },
        {
          id: "d",
          rent_price: 500,
          /* due_day omitted to trigger default */ status: "occupied",
        },
        { id: "e", rent_price: 500, due_day: 10, status: "vacant" },
      ],
      [],
      fixedNow
    );
    const map = Object.fromEntries(rows.map((r) => [r.room_id, r.due_date]));
    expect(map["a"]).toBe("2025-02-01");
    expect(map["b"]).toBe("2025-02-28"); // February caps at last day
    expect(map["c"]).toBe("2025-02-15");
    expect(map["d"]).toBe("2025-02-05");
    // Additional month with 31 days to ensure 31 preserved
    const march = buildMissingPayments(
      "2025-03",
      [
        { id: "m", rent_price: 500, due_day: 31, status: "occupied" },
        { id: "n", rent_price: 500, due_day: 35, status: "occupied" },
      ],
      [],
      fixedNow
    );
    const marchMap = Object.fromEntries(
      march.map((r) => [r.room_id, r.due_date])
    );
    expect(marchMap["m"]).toBe("2025-03-31");
    expect(marchMap["n"]).toBe("2025-03-31");
    expect(map["e"]).toBeUndefined();
  });

  it("copies rent_price into amount_due and sets zero amount_paid with null payment_date", () => {
    const [row] = buildMissingPayments(
      "2025-04",
      [{ id: "x", rent_price: 777, due_day: 7, status: "occupied" }],
      [],
      fixedNow
    );
    expect(row.amount_due).toBe(777);
    expect(row.amount_paid).toBe(0);
    expect(row.payment_date).toBeNull();
    expect(row.method).toBeNull();
    expect(row.billing_month).toBe("2025-04-01");
    expect(row.created_at).toBe(fixedNow.toISOString());
  });
});

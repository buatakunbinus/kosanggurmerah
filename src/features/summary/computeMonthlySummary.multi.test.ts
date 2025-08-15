import { describe, it, expect } from "vitest";
import { computeMonthlySummary } from "./computeMonthlySummary";
import type { Payment, Penalty, Expense } from "../../types/models";

describe("computeMonthlySummary multi-month", () => {
  it("aggregates across months with correct realized vs gross", () => {
    const payments: Payment[] = [
      {
        id: "p1",
        room_id: "r1",
        billing_month: "2025-07-01",
        due_date: "2025-07-05",
        amount_due: 100,
        amount_paid: 100,
        payment_date: "2025-07-05",
        method: "cash",
        created_at: "",
        updated_at: "",
      },
      {
        id: "p2",
        room_id: "r1",
        billing_month: "2025-08-01",
        due_date: "2025-08-05",
        amount_due: 100,
        amount_paid: 0,
        payment_date: null,
        method: null,
        created_at: "",
        updated_at: "",
      },
    ];
    const penalties: Penalty[] = [
      {
        id: "pen1",
        room_id: "r1",
        type: "late_payment",
        custom_description: null,
        amount: 20,
        incident_date: "2025-08-10",
        paid: false,
        paid_date: null,
        notes: null,
        created_at: "",
      },
    ];
    const expenses: Expense[] = [
      {
        id: "e1",
        date: "2025-07-15",
        category: "water",
        amount: 30,
        notes: null,
        created_at: "",
      },
      {
        id: "e2",
        date: "2025-08-15",
        category: "water",
        amount: 40,
        notes: null,
        created_at: "",
      },
    ];

    const rows = computeMonthlySummary(payments, penalties, expenses).sort(
      (a, b) => a.month.localeCompare(b.month)
    );
    expect(rows).toHaveLength(2);
    const july = rows[0];
    const aug = rows[1];

    expect(july.month).toBe("2025-07");
    expect(july.rent_invoiced).toBe(100);
    expect(july.rent_collected).toBe(100);
    expect(july.penalties_incurred).toBe(0);
    expect(july.penalties_collected).toBe(0);
    expect(july.expenses_total).toBe(30);
    expect(july.net_realized).toBe(70); // 100 - 30
    expect(july.net_gross).toBe(70);

    expect(aug.month).toBe("2025-08");
    expect(aug.rent_invoiced).toBe(100);
    expect(aug.rent_collected).toBe(0);
    expect(aug.penalties_incurred).toBe(20);
    expect(aug.penalties_collected).toBe(0);
    expect(aug.expenses_total).toBe(40);
    expect(aug.net_realized).toBe(-40); // 0 - 40
    expect(aug.net_gross).toBe(-40 + 20); // (0 + 20) - 40 = -20
  });
});

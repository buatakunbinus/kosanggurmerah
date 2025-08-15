import { describe, it, expect } from "vitest";
import { computeMonthlySummary } from "./computeMonthlySummary";
import { Payment, Penalty, Expense } from "../../types/models";

const iso = (s: string) => s;

describe("computeMonthlySummary", () => {
  it("aggregates correctly", () => {
    const payments: Payment[] = [
      {
        id: "p1",
        room_id: "r1",
        billing_month: iso("2025-01-01"),
        due_date: iso("2025-01-05"),
        amount_due: 1000000,
        amount_paid: 1000000,
        payment_date: iso("2025-01-03"),
        method: "cash",
        created_at: "",
        updated_at: "",
      },
      {
        id: "p2",
        room_id: "r1",
        billing_month: iso("2025-02-01"),
        due_date: iso("2025-02-05"),
        amount_due: 1000000,
        amount_paid: 500000,
        payment_date: iso("2025-02-20"),
        method: "cash",
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
        amount: 50000,
        incident_date: iso("2025-02-06"),
        paid: false,
        paid_date: null,
        notes: null,
        created_at: "",
      },
    ];
    const expenses: Expense[] = [
      {
        id: "e1",
        date: iso("2025-01-10"),
        category: "electricity",
        amount: 200000,
        notes: null,
        created_at: "",
      },
      {
        id: "e2",
        date: iso("2025-02-11"),
        category: "water",
        amount: 150000,
        notes: null,
        created_at: "",
      },
    ];

    const rows = computeMonthlySummary(payments, penalties, expenses).sort(
      (a, b) => a.month.localeCompare(b.month)
    );
    expect(rows.length).toBe(2);
    const jan = rows[0];
    expect(jan.month).toBe("2025-01");
    expect(jan.rent_invoiced).toBe(1000000);
    expect(jan.rent_collected).toBe(1000000);
    expect(jan.expenses_total).toBe(200000);
    expect(jan.net_realized).toBe(800000);
    const feb = rows[1];
    expect(feb.rent_invoiced).toBe(1000000);
    expect(feb.rent_collected).toBe(500000);
    expect(feb.penalties_incurred).toBe(50000);
    expect(feb.expenses_total).toBe(150000);
  });
});

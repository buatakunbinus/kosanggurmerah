import { describe, it, expect } from "vitest";
import { derivePaymentStatus } from "./status";
import type { Payment } from "../../types/models";

function make(base: Partial<Payment>): Payment {
  return {
    id: "p1",
    room_id: "r1",
    billing_month: "2025-08-01",
    due_date: "2025-08-05",
    amount_due: 100000,
    amount_paid: null,
    payment_date: null,
    method: null,
    created_at: "2025-08-01",
    updated_at: "2025-08-01",
    ...base,
  } as Payment;
}

describe("derivePaymentStatus", () => {
  it("paid when amount_paid >= amount_due", () => {
    const p = make({ amount_paid: 100000 });
    expect(derivePaymentStatus(p)).toBe("paid");
  });
  it("unpaid before due date", () => {
    const futureDue = new Date();
    futureDue.setDate(futureDue.getDate() + 5);
    const p = make({
      due_date: futureDue.toISOString().slice(0, 10),
      amount_paid: 0,
    });
    expect(derivePaymentStatus(p)).toBe("unpaid");
  });
  it("late after due date and not fully paid", () => {
    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 5);
    const p = make({
      due_date: pastDue.toISOString().slice(0, 10),
      amount_paid: 50000,
      amount_due: 100000,
    });
    expect(derivePaymentStatus(p)).toBe("late");
  });
});

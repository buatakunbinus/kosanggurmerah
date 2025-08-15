import type { Payment } from "../../types/models";

export function derivePaymentStatus(p: Payment): "paid" | "unpaid" | "late" {
  const due = new Date(p.due_date);
  const today = new Date();
  const paidEnough = (p.amount_paid ?? 0) >= p.amount_due;
  if (paidEnough) return "paid";
  if (!paidEnough && today > due) return "late";
  return "unpaid";
}

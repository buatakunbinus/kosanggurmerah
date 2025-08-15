import {
  Payment,
  Penalty,
  Expense,
  MonthlySummaryRow,
} from "../../types/models";
import { groupBy } from "../../utils/groupBy";

// Utility to get YYYY-MM from ISO date
const ym = (d: string) => d.slice(0, 7);

// activeRoomIds (optional) filters out payments for rooms that no longer exist (e.g., deleted)
export function computeMonthlySummary(
  payments: Payment[],
  penalties: Penalty[],
  expenses: Expense[],
  activeRoomIds?: Set<string>
): MonthlySummaryRow[] {
  const filteredPayments = activeRoomIds
    ? payments.filter((p) => activeRoomIds.has(p.room_id))
    : payments;
  const filteredPenalties = activeRoomIds
    ? penalties.filter((p) => activeRoomIds.has(p.room_id))
    : penalties;
  const paymentsByMonth = groupBy(filteredPayments, (p) => ym(p.billing_month));
  const penaltiesByMonth = groupBy(filteredPenalties, (p) =>
    ym(p.incident_date)
  );
  const expensesByMonth = groupBy(expenses, (e) => ym(e.date));

  const months = new Set<string>();
  [paymentsByMonth, penaltiesByMonth, expensesByMonth].forEach((m) =>
    Object.keys(m).forEach((k) => months.add(k))
  );

  const rows: MonthlySummaryRow[] = [];
  [...months].sort().forEach((month) => {
    const pay = paymentsByMonth[month] || [];
    const pen = penaltiesByMonth[month] || [];
    const exp = expensesByMonth[month] || [];

    const rent_invoiced = pay.reduce((s, p) => s + p.amount_due, 0);
    const rent_collected = pay.reduce(
      (s, p) => s + (p.amount_paid ? Math.min(p.amount_paid, p.amount_due) : 0),
      0
    );
    const penalties_incurred = pen.reduce((s, p) => s + p.amount, 0);
    const penalties_collected = pen.reduce(
      (s, p) => s + (p.paid ? p.amount : 0),
      0
    );
    const expenses_total = exp.reduce((s, e) => s + e.amount, 0);
    const net_realized = rent_collected + penalties_collected - expenses_total;
    const net_gross = rent_collected + penalties_incurred - expenses_total;

    rows.push({
      month,
      rent_invoiced,
      rent_collected,
      penalties_incurred,
      penalties_collected,
      expenses_total,
      net_realized,
      net_gross,
    });
  });

  return rows;
}

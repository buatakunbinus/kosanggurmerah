import React, { useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Payment, Penalty } from "../../types/models";
import { listPayments } from "../payments/paymentService";
import { listPenalties } from "../penalties/penaltyService";
import { listExpenses } from "../expenses/expenseService";
import { computeMonthlySummary } from "./computeMonthlySummary";
import { listRooms } from "../rooms/roomService";
import { exportSummaryToPDF } from "./exportSummary";
import { formatCurrency } from "../../utils/format";
import { t } from "../../i18n/id";
import { useMonth } from "../../ui/MonthContext";
// Charts removed per request; simplified textual KPIs only.

export const SummaryDashboard: React.FC = () => {
  const { month, setMonth } = useMonth(); // single month focus per request
  const qc = useQueryClient();
  // Helpers to navigate months
  const [year, mon] = month.split("-").map(Number);
  const prevMonth = mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, "0")}`;
  const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  const paymentsQ = useQuery<ReturnType<typeof listPayments> extends Promise<infer T> ? T : unknown>({
    queryKey: ["payments", month],
    queryFn: () => listPayments(month),
    staleTime: 60_000,
  });
  const roomsQ = useQuery({
    queryKey: ["rooms", "all"],
    queryFn: () => listRooms(),
    staleTime: 5 * 60_000,
  });
  const penaltiesQ = useQuery<ReturnType<typeof listPenalties> extends Promise<infer T> ? T : unknown>({
    queryKey: ["penalties", month],
    queryFn: () => listPenalties(month),
    staleTime: 60_000,
  });
  const expensesQ = useQuery<ReturnType<typeof listExpenses> extends Promise<infer T> ? T : unknown>({
    queryKey: ["expenses", month],
    queryFn: () => listExpenses(month),
    staleTime: 60_000,
  });

  // Prefetch previous & next month data opportunistically for smoother navigation
  useEffect(() => {
    qc.prefetchQuery({ queryKey: ["payments", prevMonth], queryFn: () => listPayments(prevMonth) });
    qc.prefetchQuery({ queryKey: ["payments", nextMonth], queryFn: () => listPayments(nextMonth) });
    qc.prefetchQuery({ queryKey: ["penalties", prevMonth], queryFn: () => listPenalties(prevMonth) });
    qc.prefetchQuery({ queryKey: ["penalties", nextMonth], queryFn: () => listPenalties(nextMonth) });
    qc.prefetchQuery({ queryKey: ["expenses", prevMonth], queryFn: () => listExpenses(prevMonth) });
    qc.prefetchQuery({ queryKey: ["expenses", nextMonth], queryFn: () => listExpenses(nextMonth) });
  }, [qc, prevMonth, nextMonth]);

  const summary = useMemo(() => {
    if (!paymentsQ.data || !penaltiesQ.data || !expensesQ.data) return [];
    const activeRoomIds = roomsQ.data
      ? new Set(roomsQ.data.map((r) => r.id))
      : undefined;
    // compute only for current month
    return computeMonthlySummary(
      paymentsQ.data,
      penaltiesQ.data,
      expensesQ.data,
      activeRoomIds
    ).filter((r) => r.month === month);
  }, [paymentsQ.data, penaltiesQ.data, expensesQ.data, roomsQ.data, month]);

  const current = summary[0];
  // Derived KPIs per new definitions:
  // Sewa Ditagihkan: total harga sewa semua kamar berstatus occupied bulan ini (independen dari ada/tidaknya payment record)
  // Sewa Terkumpul: total sewa kamar yang sudah LUNAS (amount_paid >= amount_due) bulan ini
  // Denda Terjadi: jumlah aktivitas denda (count penalties)
  // Denda Terkumpul: total nominal denda (regardless paid) -> penalties_incurred
  const penaltiesData = (penaltiesQ.data as Penalty[]) || [];
  const penaltyCount = penaltiesData.length;
  const occupiedRent = roomsQ.data
    ? roomsQ.data
        .filter((r) => r.status === "occupied")
        .reduce((s, r) => s + r.rent_price, 0)
    : 0;
  const paymentsData = (paymentsQ.data as Payment[]) || [];
  const rentCollectedFull = paymentsData
    .filter((p) => p.amount_paid !== null && p.amount_paid >= p.amount_due)
    .reduce((s, p) => s + p.amount_due, 0);
  const loading =
    paymentsQ.isLoading ||
    penaltiesQ.isLoading ||
    expensesQ.isLoading ||
    roomsQ.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-base sm:text-lg font-semibold tracking-wide">
            {t("monthlySummary")}
          </h2>
          <label className="flex items-center gap-2 text-xs sm:text-sm bg-white border rounded px-3 py-1 shadow-sm w-full sm:w-auto justify-between">
            <span className="font-medium">Bulan</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded px-1 py-0.5 text-xs flex-1 sm:flex-none"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            disabled={!summary.length}
            onClick={() => exportSummaryToPDF(summary)}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export ringkasan sebagai PDF"
          >
            📄 PDF
          </button>
          {loading && <span className="text-gray-500 text-xs">Loading...</span>}
        </div>
      </div>
      {loading && !current && (
        <div className="grid md:grid-cols-6 gap-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 rounded border bg-white">
              <div className="h-2.5 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}
      {current && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label={t("rentInvoiced")} value={occupiedRent} />
          <SummaryCard label={t("rentCollected")} value={rentCollectedFull} />
          <SummaryCard label={t("penaltiesIncurred")} value={penaltyCount} />
          <SummaryCard
            label={t("penaltiesCollected")}
            value={current.penalties_incurred}
          />
          <SummaryCard
            label={t("expenses")}
            value={current.expenses_total}
            negative
          />
          <SummaryCard
            label={t("netRealized")}
            value={current.net_realized}
            highlight
          />
        </div>
      )}
      {!loading && summary.length === 0 && (
        <p className="text-xs text-gray-500">No data yet.</p>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: number;
  negative?: boolean;
  highlight?: boolean;
}> = ({ label, value, negative, highlight }) => (
  <div
    className={`p-3 rounded border bg-white ${
      highlight ? "ring-2 ring-green-200" : ""
    }`}
  >
    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
      {label}
    </div>
    <div
      className={`text-sm font-semibold ${
        negative
          ? "text-red-600"
          : highlight
          ? "text-green-700"
          : "text-gray-900"
      }`}
    >
      {negative ? `-${formatCurrency(value)}` : formatCurrency(value)}
    </div>
  </div>
);

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPayments } from "../payments/paymentService";
import { listPenalties } from "../penalties/penaltyService";
import { listExpenses } from "../expenses/expenseService";
import { computeMonthlySummary } from "./computeMonthlySummary";
import { listRooms } from "../rooms/roomService";
import {
  exportSummaryToCSV,
  exportSummaryToExcel,
  exportSummaryToPDF,
} from "./exportSummary";
import { formatCurrency } from "../../utils/format";
import { t } from "../../i18n/id";
import { useMonth } from "../../ui/MonthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  LineChart,
} from "recharts";

export const SummaryDashboard: React.FC = () => {
  const { month, setMonth } = useMonth();
  const currentYear = new Date().getFullYear();
  const [fromMonth, setFromMonth] = useState(`${currentYear}-01`);
  const [toMonth, setToMonth] = useState(new Date().toISOString().slice(0, 7));
  const paymentsQ = useQuery({
    queryKey: ["payments", "all"],
    queryFn: () => listPayments(),
  });
  const roomsQ = useQuery({
    queryKey: ["rooms", "all"],
    queryFn: () => listRooms(),
  });
  const penaltiesQ = useQuery({
    queryKey: ["penalties", "all"],
    queryFn: () => listPenalties(),
  });
  const expensesQ = useQuery({
    queryKey: ["expenses", "all"],
    queryFn: () => listExpenses(),
  });

  const summary = useMemo(() => {
    if (!paymentsQ.data || !penaltiesQ.data || !expensesQ.data) return [];
    const activeRoomIds = roomsQ.data
      ? new Set(roomsQ.data.map((r) => r.id))
      : undefined;
    return computeMonthlySummary(
      paymentsQ.data,
      penaltiesQ.data,
      expensesQ.data,
      activeRoomIds
    )
      .filter((r) => r.month >= fromMonth && r.month <= toMonth)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [
    paymentsQ.data,
    penaltiesQ.data,
    expensesQ.data,
    roomsQ.data,
    fromMonth,
    toMonth,
  ]);

  const latest = summary[summary.length - 1];
  const loading =
    paymentsQ.isLoading ||
    penaltiesQ.isLoading ||
    expensesQ.isLoading ||
    roomsQ.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-semibold">{t("monthlySummary")}</h2>
          <label className="flex items-center gap-2 text-sm bg-white border rounded px-3 py-1 shadow-sm">
            <span className="font-medium">Bulan</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded px-1 py-0.5 text-xs"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <label className="flex items-center gap-1">
            {t("from")}
            <input
              type="month"
              value={fromMonth}
              max={toMonth}
              onChange={(e) => setFromMonth(e.target.value)}
              className="border rounded px-1 py-0.5 text-xs"
            />
          </label>
          <label className="flex items-center gap-1">
            {t("to")}
            <input
              type="month"
              value={toMonth}
              min={fromMonth}
              onChange={(e) => setToMonth(e.target.value)}
              className="border rounded px-1 py-0.5 text-xs"
            />
          </label>
          <button
            disabled={!summary.length}
            onClick={() => exportSummaryToCSV(summary)}
            className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            aria-label="Export summary as CSV"
          >
            {t("csv")}
          </button>
          <button
            disabled={!summary.length}
            onClick={() => exportSummaryToExcel(summary)}
            className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            aria-label="Export summary as Excel workbook"
          >
            {t("excel")}
          </button>
          <button
            disabled={!summary.length}
            onClick={() => exportSummaryToPDF(summary)}
            className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            aria-label="Export summary as PDF document"
          >
            {t("pdf")}
          </button>
          {loading && <span className="text-gray-500">Loading...</span>}
        </div>
      </div>
      {loading && !latest && (
        <div className="grid md:grid-cols-6 gap-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 rounded border bg-white">
              <div className="h-2.5 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <SummaryCard label={t("rentInvoiced")} value={latest.rent_invoiced} />
          <SummaryCard
            label={t("rentCollected")}
            value={latest.rent_collected}
          />
          <SummaryCard
            label={t("penaltiesIncurred")}
            value={latest.penalties_incurred}
          />
          <SummaryCard
            label={t("penaltiesCollected")}
            value={latest.penalties_collected}
          />
          <SummaryCard
            label={t("expenses")}
            value={latest.expenses_total}
            negative
          />
          <SummaryCard
            label={t("netRealized")}
            value={latest.net_realized}
            highlight
          />
        </div>
      )}
      {summary.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded p-4">
            <h3 className="text-sm font-medium mb-2">
              {t("incomeVsExpenses")}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary}
                  margin={{ top: 8, right: 16, bottom: 4, left: 64 }}
                  barCategoryGap="40%"
                >
                  <XAxis
                    dataKey="month"
                    tickFormatter={(m) => {
                      const monthNum = Number(m.slice(5, 7));
                      const indo = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "Mei",
                        "Jun",
                        "Jul",
                        "Agu",
                        "Sep",
                        "Okt",
                        "Nov",
                        "Des",
                      ];
                      return indo[monthNum - 1] || m.slice(5);
                    }}
                  />
                  <YAxis width={80} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    labelFormatter={(m) => m}
                  />
                  <Legend />
                  <Bar
                    dataKey="rent_collected"
                    stackId="a"
                    fill="#0ea5e9"
                    name={t("rentCollectedLegend")}
                  />
                  <Bar
                    dataKey="penalties_collected"
                    stackId="a"
                    fill="#f87171"
                    name={t("penaltiesCollectedLegend")}
                  />
                  <Bar
                    dataKey="expenses_total"
                    fill="#888888"
                    name={t("expensesLegend")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white border rounded p-4">
            <h3 className="text-sm font-medium mb-2">{t("netProfit")}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={summary}
                  margin={{ top: 8, right: 16, bottom: 4, left: 64 }}
                >
                  <XAxis
                    dataKey="month"
                    tickFormatter={(m) => {
                      const monthNum = Number(m.slice(5, 7));
                      const indo = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "Mei",
                        "Jun",
                        "Jul",
                        "Agu",
                        "Sep",
                        "Okt",
                        "Nov",
                        "Des",
                      ];
                      return indo[monthNum - 1] || m.slice(5);
                    }}
                  />
                  <YAxis width={80} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="net_realized"
                    stroke="#16a34a"
                    name={t("netRealizedLegend")}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_gross"
                    stroke="#6366f1"
                    name={t("netGrossLegend")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
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
      {formatCurrency(value)}
    </div>
  </div>
);

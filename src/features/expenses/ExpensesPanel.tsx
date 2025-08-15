import React, { useState } from "react";
import { useMonth } from "../../ui/MonthContext";
import { useToast } from "../../ui/ToastProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./expenseService";
import type { Expense } from "../../types/models";
import { formatCurrency } from "../../utils/format";
import { expenseCreateSchema, safeParse } from "../../utils/validation";
import { t } from "../../i18n/id";

type ExpenseCategory =
  | "electricity"
  | "water"
  | "repairs"
  | "painting"
  | "maintenance"
  | "cleaning"
  | "other";

export const ExpensesPanel: React.FC = () => {
  const { push } = useToast();
  const qc = useQueryClient();
  const { month } = useMonth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    date: string;
    category: string;
    amount: number;
    notes: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    category: "electricity",
    amount: 100000,
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const expensesQuery = useQuery({
    queryKey: ["expenses", month],
    queryFn: () => listExpenses(month),
  });

  const createMut = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", month] });
      push({ type: "success", message: t("expenseAdded") });
    },
    onError: (e) =>
      push({
        type: "error",
        message: e instanceof Error ? e.message : t("errorAddingExpense"),
      }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Expense> }) =>
      updateExpense(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", month] });
      setEditingId(null);
      push({ type: "success", message: t("expenseUpdated") });
    },
    onError: (e) =>
      push({
        type: "error",
        message: e instanceof Error ? e.message : t("errorUpdatingExpense"),
      }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", month] });
      push({ type: "success", message: t("expenseDeleted") });
    },
    onError: (e) =>
      push({
        type: "error",
        message: e instanceof Error ? e.message : t("errorDeletingExpense"),
      }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = safeParse(expenseCreateSchema, form);
    if (!parsed.success) {
      setFormError(parsed.message);
      push({ type: "error", message: parsed.message });
      return;
    }
    createMut.mutate(
      {
        date: parsed.data.date,
        category: parsed.data.category,
        amount: parsed.data.amount,
        notes: parsed.data.notes || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm((f) => ({ ...f, amount: 100000, notes: "" }));
        },
      }
    );
  };

  const onInlineSave = (expense: Expense) => {
    updateMut.mutate({
      id: expense.id,
      patch: {
        category: expense.category,
        amount: expense.amount,
        notes: expense.notes,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("expenses")}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            {open ? t("close") : t("addExpense")}
          </button>
        </div>
      </div>
      {open && (
        <form
          onSubmit={onSubmit}
          className="grid md:grid-cols-5 gap-3 bg-white p-4 border rounded text-xs"
        >
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="border rounded px-2 py-1"
          />
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
            className="border rounded px-2 py-1"
          >
            <option value="electricity">{t("electricity")}</option>
            <option value="water">{t("water")}</option>
            <option value="repairs">{t("repairs")}</option>
            <option value="painting">{t("painting")}</option>
            <option value="maintenance">{t("maintenance")}</option>
            <option value="cleaning">{t("cleaning")}</option>
            <option value="other">{t("other")}</option>
          </select>
          <input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: Number(e.target.value) }))
            }
            className="border rounded px-2 py-1"
          />
          <input
            placeholder={t("notes")}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="border rounded px-2 py-1"
          />
          <div className="flex justify-end">
            <button
              disabled={createMut.isPending}
              className="px-3 py-1.5 rounded bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
            >
              {t("save")}
            </button>
          </div>
          {formError && (
            <div className="col-span-full text-red-600" role="alert">
              {formError}
            </div>
          )}
        </form>
      )}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-3 py-2 text-left">{t("date")}</th>
              <th className="px-3 py-2 text-left">{t("category")}</th>
              <th className="px-3 py-2 text-left">{t("amount")}</th>
              <th className="px-3 py-2 text-left">{t("notes")}</th>
              <th className="px-3 py-2 text-left">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {expensesQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-t">
                  <td className="px-3 py-3">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-14 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-28 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </td>
                </tr>
              ))}
            {!expensesQuery.isLoading &&
              expensesQuery.data &&
              expensesQuery.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    {t("noExpenses")}
                  </td>
                </tr>
              )}
            {expensesQuery.data &&
              expensesQuery.data.map((exp) => {
                const editing = editingId === exp.id;
                return (
                  <tr key={exp.id} className="border-t">
                    <td className="px-3 py-1">{exp.date}</td>
                    <td className="px-3 py-1">
                      {editing ? (
                        <select
                          value={exp.category}
                          onChange={(e) => {
                            exp.category = e.target.value;
                            qc.setQueryData<Expense[] | undefined>(
                              ["expenses", month],
                              (old) =>
                                old
                                  ? old.map((o) =>
                                      o.id === exp.id
                                        ? { ...o, category: e.target.value }
                                        : o
                                    )
                                  : old
                            );
                          }}
                          className="border rounded px-1 py-0.5"
                        >
                          <option value="electricity">
                            {t("electricity")}
                          </option>
                          <option value="water">{t("water")}</option>
                          <option value="repairs">{t("repairs")}</option>
                          <option value="painting">{t("painting")}</option>
                          <option value="maintenance">
                            {t("maintenance")}
                          </option>
                          <option value="cleaning">{t("cleaning")}</option>
                          <option value="other">{t("other")}</option>
                        </select>
                      ) : (
                        t(exp.category as ExpenseCategory)
                      )}
                    </td>
                    <td className="px-3 py-1">
                      {editing ? (
                        <input
                          type="number"
                          value={exp.amount}
                          onChange={(e) => {
                            exp.amount = Number(e.target.value);
                            qc.setQueryData<Expense[] | undefined>(
                              ["expenses", month],
                              (old) =>
                                old
                                  ? old.map((o) =>
                                      o.id === exp.id
                                        ? {
                                            ...o,
                                            amount: Number(e.target.value),
                                          }
                                        : o
                                    )
                                  : old
                            );
                          }}
                          className="border rounded px-1 py-0.5 w-24"
                        />
                      ) : (
                        formatCurrency(exp.amount)
                      )}
                    </td>
                    <td className="px-3 py-1">
                      {editing ? (
                        <input
                          value={exp.notes || ""}
                          onChange={(e) => {
                            exp.notes = e.target.value;
                            qc.setQueryData<Expense[] | undefined>(
                              ["expenses", month],
                              (old) =>
                                old
                                  ? old.map((o) =>
                                      o.id === exp.id
                                        ? { ...o, notes: e.target.value }
                                        : o
                                    )
                                  : old
                            );
                          }}
                          className="border rounded px-1 py-0.5 w-40"
                        />
                      ) : (
                        exp.notes || <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1 space-x-2">
                      {editing ? (
                        <>
                          <button
                            onClick={() => onInlineSave(exp)}
                            className="text-xs text-green-600 hover:underline"
                            disabled={updateMut.isPending}
                          >
                            {t("save")}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-600 hover:underline"
                          >
                            {t("cancel")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingId(exp.id)}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => deleteMut.mutate(exp.id)}
                            className="text-xs text-red-600 hover:underline"
                            disabled={deleteMut.isPending}
                          >
                            {t("delete")}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useToast } from "../../ui/ToastProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPenalties,
  createPenalty,
  updatePenalty,
  deletePenalty,
} from "./penaltyService";
import { listRooms } from "../rooms/roomService";
import { formatCurrency } from "../../utils/format";
import { penaltyCreateSchema, safeParse } from "../../utils/validation";
import { Penalty } from "../../types/models";
import { t } from "../../i18n/id";
import { useMonth } from "../../ui/MonthContext";

export const PenaltiesPanel: React.FC = () => {
  const { push } = useToast();
  const qc = useQueryClient();
  const { month } = useMonth();
  const [open, setOpen] = useState(false);
  type PenaltyForm = {
    room_id: string;
    type: "overnight_guest" | "late_payment" | "custom";
    custom_description: string;
    amount: number | string; // allow string while typing
    incident_date: string;
    notes: string;
  };
  const [form, setForm] = useState<PenaltyForm>({
    room_id: "",
    type: "late_payment",
    custom_description: "",
    amount: 0,
    incident_date: "",
    notes: "",
  });
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{
    custom_description: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["penalties", month] });
    // month change triggers refetch; qc is stable from useQueryClient
  }, [month, qc]);

  const penaltiesQuery = useQuery({
    queryKey: ["penalties", month],
    queryFn: () => listPenalties(month),
  });
  const roomsQuery = useQuery({ queryKey: ["rooms"], queryFn: listRooms });

  const createMut = useMutation({
    mutationFn: createPenalty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penalties", month] });
      push({ type: "success", message: t("penaltyAdded") });
    },
    onError: (e) =>
      push({
        type: "error",
        message: e instanceof Error ? e.message : t("errorAddingPenalty"),
      }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Penalty> }) =>
      updatePenalty(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penalties", month] });
      push({ type: "success", message: t("penaltyUpdated") });
    },
    onError: (e) =>
      push({
        type: "error",
        message: e instanceof Error ? e.message : t("errorUpdatingPenalty"),
      }),
  });
  const deleteMut = useMutation({
    mutationFn: deletePenalty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penalties", month] });
      push({ type: "success", message: t("penaltyDeleted") });
    },
    onError: (e) =>
      push({
        type: "error",
        message: e instanceof Error ? e.message : t("errorDeletingPenalty"),
      }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = safeParse(penaltyCreateSchema, {
      ...form,
      amount: Number(form.amount),
    });
    if (!parsed.success) {
      setError(parsed.message);
      return;
    }
    createMut.mutate(
      {
        room_id: parsed.data.room_id,
        type: parsed.data.type,
        custom_description:
          parsed.data.type === "custom" ? parsed.data.custom_description : null,
        amount: parsed.data.amount,
        incident_date: parsed.data.incident_date,
        paid: false,
        paid_date: null,
        notes: parsed.data.notes || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            room_id: "",
            type: "late_payment",
            custom_description: "",
            amount: 0,
            incident_date: "",
            notes: "",
          });
        },
      }
    );
  };

  const markPaid = (p: Penalty) =>
    updateMut.mutate({
      id: p.id,
      patch: { paid: true, paid_date: new Date().toISOString().slice(0, 10) },
    });

  const startEdit = (p: Penalty) => {
    setEditingId(p.id);
    setEditingValues({
      custom_description: p.custom_description || "",
      notes: p.notes || "",
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingValues(null);
  };
  const saveEdit = (p: Penalty) => {
    if (!editingValues) return;
    updateMut.mutate(
      {
        id: p.id,
        patch: {
          custom_description:
            p.type === "custom" ? editingValues.custom_description : undefined,
          // allow clearing notes -> null
          notes: editingValues.notes ? editingValues.notes : null,
        },
      },
      {
        onSuccess: () => {
          cancelEdit();
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">{t("penalties")}</h2>
        <div className="flex items-center gap-2">
          <input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-sky-200 bg-sky-50 rounded px-3 py-1.5 text-sm w-48 placeholder:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <button
            onClick={() => setOpen((o) => !o)}
            className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
            type="button"
          >
            {open ? t("close") : t("addPenalty")}
          </button>
        </div>
      </div>
      {open && (
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-white p-4 border rounded text-xs"
        >
          <select
            required
            value={form.room_id}
            onChange={(e) =>
              setForm((f: PenaltyForm) => ({ ...f, room_id: e.target.value }))
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">{t("room")}</option>
            {roomsQuery.data &&
              roomsQuery.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number}
                </option>
              ))}
          </select>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((f: PenaltyForm) => ({
                ...f,
                type: e.target.value as PenaltyForm["type"],
              }))
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="late_payment">{t("late_payment")}</option>
            <option value="overnight_guest">{t("overnight_guest")}</option>
            <option value="custom">{t("custom")}</option>
          </select>
          {form.type === "custom" && (
            <input
              placeholder={t("description")}
              value={form.custom_description}
              onChange={(e) =>
                setForm((f: PenaltyForm) => ({
                  ...f,
                  custom_description: e.target.value,
                }))
              }
              className="border rounded px-2 py-1 w-full"
            />
          )}
          <input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((f: PenaltyForm) => ({
                ...f,
                amount: e.target.value,
              }))
            }
            className="border rounded px-2 py-1 w-full"
          />
          <input
            type="date"
            value={form.incident_date}
            onChange={(e) =>
              setForm((f: PenaltyForm) => ({
                ...f,
                incident_date: e.target.value,
              }))
            }
            className="border rounded px-2 py-1 w-full"
          />
          <input
            placeholder={t("notes")}
            value={form.notes}
            onChange={(e) =>
              setForm((f: PenaltyForm) => ({ ...f, notes: e.target.value }))
            }
            className="border rounded px-2 py-1 w-full"
          />
          <div className="md:col-span-6 flex justify-end">
            <button
              disabled={createMut.isPending}
              className="px-3 py-1.5 rounded bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
            >
              {t("save")}
            </button>
          </div>
          {error && (
            <div className="md:col-span-6 text-red-600 text-sm" role="alert">
              {error}
            </div>
          )}
        </form>
      )}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-3 py-2 text-left">{t("room")}</th>
              <th className="px-3 py-2 text-left">{t("tenant")}</th>
              <th className="px-3 py-2 text-left">{t("type")}</th>
              <th className="px-3 py-2 text-left">{t("amount")}</th>
              <th className="px-3 py-2 text-left">{t("date")}</th>
              <th className="px-3 py-2 text-left">{t("status")}</th>
              <th className="px-3 py-2 text-left">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {penaltiesQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-t">
                  <td className="px-3 py-3">
                    <div className="h-3 w-10 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-14 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-12 bg-gray-200 rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </td>
                </tr>
              ))}
            {!penaltiesQuery.isLoading &&
              penaltiesQuery.data &&
              penaltiesQuery.data.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    {t("noPenalties")}
                  </td>
                </tr>
              )}
            {penaltiesQuery.data &&
              penaltiesQuery.data
                .filter((p) => {
                  if (!searchTerm.trim()) return true;
                  const q = searchTerm.toLowerCase();
                  const roomObj = roomsQuery.data?.find(
                    (r) => r.id === p.room_id
                  );
                  const roomNum = roomObj?.number || "";
                  const tenant = roomObj?.tenant_name || "";
                  return (
                    roomNum.toLowerCase().includes(q) ||
                    tenant.toLowerCase().includes(q)
                  );
                })
                .map((p) => {
                  const roomNumber =
                    roomsQuery.data?.find((r) => r.id === p.room_id)?.number ||
                    "—";
                  const tenantName =
                    roomsQuery.data?.find((r) => r.id === p.room_id)
                      ?.tenant_name || null;
                  const rowBg = p.paid ? "bg-green-50" : "bg-yellow-50";
                  return (
                    <tr key={p.id} className={`border-t ${rowBg}`}>
                      <td className="px-3 py-1">{roomNumber}</td>
                      <td className="px-3 py-1">
                        {tenantName || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-1">
                        {editingId === p.id && p.type === "custom" ? (
                          <input
                            value={editingValues?.custom_description || ""}
                            onChange={(e) =>
                              setEditingValues((v) =>
                                v
                                  ? { ...v, custom_description: e.target.value }
                                  : v
                              )
                            }
                            className="border rounded px-1 py-0.5 w-40"
                          />
                        ) : p.type === "custom" ? (
                          p.custom_description || t("custom")
                        ) : (
                          t(p.type)
                        )}
                      </td>
                      <td className="px-3 py-1">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-1">{p.incident_date}</td>
                      <td className="px-3 py-1">
                        {editingId === p.id ? (
                          <input
                            placeholder={t("notes")}
                            value={editingValues?.notes || ""}
                            onChange={(e) =>
                              setEditingValues((v) =>
                                v ? { ...v, notes: e.target.value } : v
                              )
                            }
                            className="border rounded px-1 py-0.5 w-40"
                          />
                        ) : p.paid ? (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">
                            {t("paid")}
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">
                            {t("unpaid")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1 space-x-2">
                        {editingId === p.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(p)}
                              className="text-xs text-green-600 hover:underline"
                              disabled={updateMut.isPending}
                              type="button"
                            >
                              {t("save")}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs text-gray-600 hover:underline"
                              type="button"
                            >
                              {t("cancel")}
                            </button>
                          </>
                        ) : (
                          <>
                            {!p.paid && (
                              <button
                                onClick={() => markPaid(p)}
                                className="text-xs text-indigo-600 hover:underline"
                                disabled={updateMut.isPending}
                                type="button"
                              >
                                {t("markPaid")}
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(p)}
                              className="text-xs text-blue-600 hover:underline"
                              type="button"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => deleteMut.mutate(p.id)}
                              className="text-xs text-red-600 hover:underline"
                              disabled={deleteMut.isPending}
                              type="button"
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

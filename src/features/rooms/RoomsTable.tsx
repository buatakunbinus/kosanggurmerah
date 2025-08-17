import React, { useState } from "react";
import { useToast } from "../../ui/ToastProvider";
import { useRooms } from "./useRooms";
import { ROOM_CODES } from "./roomService";
import { getEffectiveOccupants } from "./occupancyService";
import { useMonth } from "../../ui/MonthContext";
import { useQuery } from "@tanstack/react-query";
import { listPayments } from "../payments/paymentService";
import { derivePaymentStatus } from "../payments/status";
import { listPenalties } from "../penalties/penaltyService";
import { formatCurrency, formatStatusBadgeColor } from "../../utils/format";
import type { Payment, Penalty } from "../../types/models";
import { PaymentRecordForm } from "../payments/PaymentRecordForm";
import { t } from "../../i18n/id";

interface NewRoomFormState {
  number: string;
  rent_price: number;
  tenant_name: string;
  status: "occupied" | "vacant";
  due_day: number;
}

const initialForm: NewRoomFormState = {
  number: "",
  rent_price: 800000,
  tenant_name: "",
  status: "occupied",
  due_day: 17, // default placeholder day (today)
};

export const RoomsTable: React.FC = () => {
  const { push } = useToast();
  const { month } = useMonth();
  const { roomsQuery, createMut, deleteMut, updateMut } = useRooms(month);
  const occupantsQuery = useQuery({
    queryKey: ["occupants", month],
    queryFn: () => getEffectiveOccupants(month),
  });
  const paymentsQuery = useQuery({
    queryKey: ["payments", month],
    queryFn: () => listPayments(month),
  });
  const penaltiesQuery = useQuery({
    queryKey: ["penalties", month],
    queryFn: () => listPenalties(month),
  });
  const [form, setForm] = useState<NewRoomFormState>(initialForm);
  const [open, setOpen] = useState(false);
  const [openPaymentRoom, setOpenPaymentRoom] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    tenant_name: string;
    status: "occupied" | "vacant";
    rent_price: number;
    due_day: number;
  } | null>(null);
  const [sortByDue, setSortByDue] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(
      {
        number: form.number,
        rent_price: form.rent_price,
        status: form.status,
        tenant_name: form.status === "occupied" ? form.tenant_name : null,
        due_day: form.due_day,
      },
      {
        onSuccess: () => {
          setForm(initialForm);
          setOpen(false);
          push({ type: "success", message: t("roomAdded") });
        },
        onError: (e) =>
          push({
            type: "error",
            message: e instanceof Error ? e.message : t("errorAddRoom"),
          }),
      }
    );
  };

  const paymentByRoom: Record<string, Payment[]> = {};
  (paymentsQuery.data || []).forEach((p) => {
    (paymentByRoom[p.room_id] ||= []).push(p);
  });
  const penaltiesByRoom: Record<string, Penalty[]> = {};
  (penaltiesQuery.data || []).forEach((p) => {
    (penaltiesByRoom[p.room_id] ||= []).push(p);
  });
  const loading =
    roomsQuery.isLoading ||
    paymentsQuery.isLoading ||
    penaltiesQuery.isLoading ||
    occupantsQuery.isLoading;

  return (
    <div className="space-y-4">
      {/* Header + metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
          <h2 className="text-base sm:text-lg font-semibold tracking-wide">{t("rooms")}</h2>
          <button
            type="button"
            onClick={() => setSortByDue((s) => !s)}
            className={`md:hidden px-2 py-1 rounded text-[11px] font-medium border transition ${
              sortByDue
                ? "bg-yellow-500 text-white border-yellow-600"
                : "bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            }`}
          >
            {sortByDue ? t("dueSortNearest") : t("dueSort")}
          </button>
        </div>
        <div className="flex items-start gap-3 flex-wrap w-full md:w-auto">
          {roomsQuery.data && (() => {
            const totalSlots = ROOM_CODES.length;
            const occupied = roomsQuery.data.length;
            const left = Math.max(0, totalSlots - occupied);
            let paid = 0;
            roomsQuery.data.forEach((r) => {
              const payments = paymentByRoom[r.id];
              if (payments && payments.length) {
                const status = derivePaymentStatus(payments[0]);
                if (status === "paid") paid += 1;
              }
            });
            return (
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 md:gap-4 text-[11px] sm:text-sm md:text-base font-semibold text-gray-700 bg-green-50 border border-green-200 rounded px-3 py-2 w-full md:w-auto">
                <span>
                  {t("totalOccupied")}: <span className="text-brand-600">{occupied}</span>/{totalSlots}
                </span>
                <span>
                  {t("roomsLeft")}: <span className="text-indigo-600">{left}</span>
                </span>
                <span>
                  {t("totalPaid")}: <span className="text-green-600">{paid}</span>
                </span>
                <span>
                  {t("totalUnpaid")}: <span className="text-red-600">{Math.max(0, occupied - paid)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSortByDue((s) => !s)}
                  className={`hidden md:inline-block px-2 py-1 rounded text-[11px] md:text-[13px] font-medium border transition ${
                    sortByDue
                      ? "bg-yellow-500 text-white border-yellow-600"
                      : "bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                  }`}
                >
                  {sortByDue ? t("dueSortNearest") : t("dueSort")}
                </button>
              </div>
            );
          })()}
          <input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-sky-200 bg-sky-50 rounded px-3 py-1.5 text-xs w-full md:w-56 placeholder:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 w-full md:w-auto"
          >
            {open ? t("close") : t("addRoom")}
          </button>
        </div>
      </div>
      {/* Create form */}
      {open && (
        <form
          onSubmit={onSubmit}
          className="flex flex-col sm:flex-row flex-wrap gap-2 bg-white p-3 border rounded text-xs"
        >
          <select
            required
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
          >
            <option value="">{t("room")} #</option>
            {ROOM_CODES.filter(
              (code) => !(roomsQuery.data || []).some((r) => r.number === code)
            ).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            placeholder={t("rent")}
            value={form.rent_price}
            onChange={(e) =>
              setForm((f) => ({ ...f, rent_price: Number(e.target.value) }))
            }
            className="border rounded px-2 py-1 text-sm w-full sm:w-28"
          />
            <input
              type="number"
              min={1}
              max={31}
              placeholder="17"
              value={form.due_day}
              onChange={(e) =>
                setForm((f) => ({ ...f, due_day: Number(e.target.value) }))
              }
              className="border rounded px-2 py-1 text-sm w-full sm:w-20"
            />
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as "occupied" | "vacant",
              }))
            }
            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
          >
            <option value="occupied">{t("occupied")}</option>
            <option value="vacant">{t("vacant")}</option>
          </select>
          {form.status === "occupied" && (
            <input
              placeholder={t("tenant")}
              value={form.tenant_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, tenant_name: e.target.value }))
              }
              className="border rounded px-2 py-1 text-sm w-full sm:w-40"
            />
          )}
          <button
            disabled={createMut.isPending}
            className="px-3 py-1.5 rounded bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
          >
            {t("save")}
          </button>
        </form>
      )}
      {/* Desktop table */}
      <div className="overflow-x-auto bg-white border rounded hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">{t("tenant")}</th>
              <th className="px-3 py-2 text-left">{t("rent")}</th>
              <th className="px-3 py-2 text-left">{t("dueDay")}</th>
              <th className="px-3 py-2">{t("paymentStatus")}</th>
              <th className="px-3 py-2">{t("penaltiesThisMonth")}</th>
              <th className="px-3 py-2">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="animate-pulse border-t">
                <td className="px-3 py-3">
                  <div className="h-3 w-10 bg-gray-200 rounded" />
                </td>
                <td className="px-3 py-3">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </td>
                <td className="px-3 py-3">
                  <div className="h-3 w-14 bg-gray-200 rounded" />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="h-3 w-6 bg-gray-200 rounded mx-auto" />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="h-5 w-16 bg-gray-200 rounded mx-auto" />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="h-3 w-12 bg-gray-200 rounded mx-auto" />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="h-3 w-20 bg-gray-200 rounded mx-auto" />
                </td>
              </tr>
            ))}
            {!loading && roomsQuery.data && roomsQuery.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-xs text-gray-500">
                  {t("noRooms")}
                </td>
              </tr>
            )}
            {roomsQuery.data && roomsQuery.data
              .filter((r) => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return (
                  r.number.toLowerCase().includes(q) ||
                  (r.tenant_name || "").toLowerCase().includes(q)
                );
              })
              .sort((a, b) => {
                if (sortByDue) {
                  if (a.due_day === b.due_day) return a.number.localeCompare(b.number);
                  return a.due_day - b.due_day;
                }
                return a.number.localeCompare(b.number);
              })
              .map((room) => {
                const payments = paymentByRoom[room.id] || [];
                const payment = payments[0];
                const status = payment ? derivePaymentStatus(payment) : "unpaid";
                const occupantName = occupantsQuery.data?.[room.id] || room.tenant_name || "";
                let statusLabel: string = status;
                if (status === "late" && payment) {
                  const due = new Date(payment.due_date);
                  const today = new Date();
                  const daysLate = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
                  statusLabel = t("lateDays", { days: daysLate });
                }
                if (statusLabel === "paid") statusLabel = t("paid");
                if (statusLabel === "unpaid") statusLabel = t("unpaid");
                const penalties = penaltiesByRoom[room.id] || [];
                const penaltyTotal = penalties.reduce((s, p) => s + p.amount, 0);
                const showPaymentAction = status !== "paid";
                const rowBg =
                  status === "paid" ? "bg-green-50" : status === "late" ? "bg-red-50" : "bg-yellow-50";
                const isEditing = editingId === room.id;
                if (isEditing && !editValues) {
                  setEditValues({
                    tenant_name: room.tenant_name || "",
                    status: room.status as "occupied" | "vacant",
                    rent_price: room.rent_price,
                    due_day: room.due_day,
                  });
                }
                return (
                  <React.Fragment key={room.id}>
                    <tr className={`border-t ${rowBg}`}>
                      <td className="px-3 py-2 font-medium">{room.number}</td>
                      {isEditing && editValues ? (
                        <>
                          <td className="px-3 py-2">
                            {editValues.status === "occupied" ? (
                              <input
                                value={editValues.tenant_name}
                                onChange={(e) =>
                                  setEditValues((v) => (v ? { ...v, tenant_name: e.target.value } : v))
                                }
                                className="border rounded px-2 py-1 text-xs w-28"
                                placeholder={t("tenant")}
                              />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={editValues.rent_price}
                              onChange={(e) =>
                                setEditValues((v) => (v ? { ...v, rent_price: Number(e.target.value) } : v))
                              }
                              className="border rounded px-2 py-1 text-xs w-24"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={editValues.due_day}
                              onChange={(e) =>
                                setEditValues((v) => (v ? { ...v, due_day: Number(e.target.value) } : v))
                              }
                              className="border rounded px-2 py-1 text-xs w-16"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <select
                              value={editValues.status}
                              onChange={(e) =>
                                setEditValues((v) =>
                                  v
                                    ? {
                                        ...v,
                                        status: e.target.value as "occupied" | "vacant",
                                        tenant_name: e.target.value === "occupied" ? v.tenant_name : "",
                                      }
                                    : v
                                )
                              }
                              className="border rounded px-2 py-1 text-xs"
                            >
                              <option value="occupied">{t("occupied")}</option>
                              <option value="vacant">{t("vacant")}</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center space-x-1" colSpan={2}>
                            <button
                              disabled={
                                updateMut.isPending ||
                                (editValues.status === "occupied" && !editValues.tenant_name.trim())
                              }
                              onClick={() => {
                                if (!editValues) return;
                                if (editValues.due_day < 1 || editValues.due_day > 31) {
                                  push({ type: "error", message: t("errorDueDayRange") });
                                  return;
                                }
                                const safeDue = Math.min(31, Math.max(1, editValues.due_day));
                                updateMut.mutate(
                                  {
                                    id: room.id,
                                    patch: {
                                      tenant_name:
                                        editValues.status === "occupied" ? editValues.tenant_name.trim() : null,
                                      status: editValues.status,
                                      rent_price: editValues.rent_price,
                                      due_day: safeDue,
                                    },
                                  },
                                  {
                                    onSuccess: () => {
                                      push({ type: "success", message: t("roomUpdated") });
                                      setEditingId(null);
                                      setEditValues(null);
                                    },
                                    onError: (e) =>
                                      push({
                                        type: "error",
                                        message: e instanceof Error ? e.message : t("errorUpdateRoom"),
                                      }),
                                  }
                                );
                              }}
                              type="button"
                              className="text-xs text-green-600 hover:underline"
                            >
                              {t("save")}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditValues(null);
                              }}
                              type="button"
                              className="text-xs text-gray-500 hover:underline"
                            >
                              {t("cancel")}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">{occupantName || <span className="text-gray-400">—</span>}</td>
                          <td className="px-3 py-2">{formatCurrency(room.rent_price)}</td>
                          <td className="px-3 py-2 text-center">{room.due_day}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-medium ${formatStatusBadgeColor(status)}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {penalties.length > 0 ? (
                              <span className="text-xs font-medium text-red-600">
                                {penalties.length} / {formatCurrency(penaltyTotal)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">0</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center space-x-2">
                            {showPaymentAction && (
                              <button
                                onClick={() => setOpenPaymentRoom((r) => (r === room.id ? null : room.id))}
                                className="text-xs text-indigo-600 hover:underline"
                                type="button"
                              >
                                {openPaymentRoom === room.id ? t("close") : t("recordPayment")}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingId(room.id);
                                setEditValues({
                                  tenant_name: room.tenant_name || "",
                                  status: room.status as "occupied" | "vacant",
                                  rent_price: room.rent_price,
                                  due_day: room.due_day,
                                });
                              }}
                              type="button"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() =>
                                deleteMut.mutate(room.id, {
                                  onSuccess: () => push({ type: "success", message: t("roomDeleted") }),
                                  onError: (e) =>
                                    push({
                                      type: "error",
                                      message: e instanceof Error ? e.message : t("errorDeleteRoom"),
                                    }),
                                })
                              }
                              className="text-xs text-red-600 hover:underline"
                              disabled={deleteMut.isPending}
                              type="button"
                            >
                              {t("delete")}
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                    {openPaymentRoom === room.id && !isEditing && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={7} className="px-3">
                          <PaymentRecordForm
                            roomId={room.id}
                            payment={payment}
                            amountDue={room.rent_price}
                            billingMonth={month}
                            dueDay={room.due_day}
                            onSuccess={() => {
                              setOpenPaymentRoom(null);
                              paymentsQuery.refetch();
                            }}
                            onCancel={() => setOpenPaymentRoom(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded bg-white p-3 animate-pulse space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}
        {!loading && roomsQuery.data && roomsQuery.data
          .filter((r) => {
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase();
            return r.number.toLowerCase().includes(q) || (r.tenant_name || "").toLowerCase().includes(q);
          })
          .sort((a, b) => {
            if (sortByDue) {
              if (a.due_day === b.due_day) return a.number.localeCompare(b.number);
              return a.due_day - b.due_day;
            }
            return a.number.localeCompare(b.number);
          })
          .map((room) => {
            const payments = paymentByRoom[room.id] || [];
            const payment = payments[0];
            const status = payment ? derivePaymentStatus(payment) : "unpaid";
            const occupantName = occupantsQuery.data?.[room.id] || room.tenant_name || "";
            const penalties = penaltiesByRoom[room.id] || [];
            const penaltyTotal = penalties.reduce((s, p) => s + p.amount, 0);
            const showPaymentAction = status !== "paid";
            const isEditing = editingId === room.id;
            if (isEditing && !editValues) {
              setEditValues({
                tenant_name: room.tenant_name || "",
                status: room.status as "occupied" | "vacant",
                rent_price: room.rent_price,
                due_day: room.due_day,
              });
            }
            return (
              <div key={room.id} className="border rounded bg-white p-3 shadow-sm flex flex-col gap-2">
                {!isEditing && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">#{room.number}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${formatStatusBadgeColor(status)}`}>
                        {status === "paid" ? t("paid") : status === "unpaid" ? t("unpaid") : status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>
                        <span className="font-medium">{t("tenant")}:</span> {occupantName || <span className="text-gray-400">—</span>}
                      </div>
                      <div>
                        <span className="font-medium">{t("rent")}:</span> {formatCurrency(room.rent_price)}
                      </div>
                      <div>
                        <span className="font-medium">{t("dueDay")}:</span> {room.due_day}
                      </div>
                      <div>
                        <span className="font-medium">{t("penalties")}:</span> {penalties.length} / {formatCurrency(penaltyTotal)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                      {showPaymentAction && (
                        <button
                          onClick={() => setOpenPaymentRoom((r) => (r === room.id ? null : room.id))}
                          className="px-2 py-0.5 rounded bg-indigo-600 text-white"
                        >
                          {openPaymentRoom === room.id ? t("close") : t("recordPayment")}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(room.id);
                          setEditValues({
                            tenant_name: room.tenant_name || "",
                            status: room.status as "occupied" | "vacant",
                            rent_price: room.rent_price,
                            due_day: room.due_day,
                          });
                        }}
                        className="px-2 py-0.5 rounded bg-blue-600 text-white"
                      >
                        {t("edit")}
                      </button>
                      <button
                        onClick={() =>
                          deleteMut.mutate(room.id, {
                            onSuccess: () => push({ type: "success", message: t("roomDeleted") }),
                            onError: (e) =>
                              push({
                                type: "error",
                                message: e instanceof Error ? e.message : t("errorDeleteRoom"),
                              }),
                          })
                        }
                        className="px-2 py-0.5 rounded bg-red-600 text-white"
                      >
                        {t("delete")}
                      </button>
                    </div>
                    {openPaymentRoom === room.id && (
                      <div className="pt-2 border-t">
                        <PaymentRecordForm
                          roomId={room.id}
                          payment={payment}
                          amountDue={room.rent_price}
                          billingMonth={month}
                          dueDay={room.due_day}
                          onSuccess={() => {
                            setOpenPaymentRoom(null);
                            paymentsQuery.refetch();
                          }}
                          onCancel={() => setOpenPaymentRoom(null)}
                        />
                      </div>
                    )}
                  </>
                )}
                {isEditing && editValues && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">#{room.number} – {t("edit")}</span>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditValues(null);
                        }}
                        className="text-[11px] text-gray-500 underline"
                        type="button"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="col-span-2">
                        <label className="block mb-1 font-medium">{t("status")}</label>
                        <select
                          value={editValues.status}
                          onChange={(e) =>
                            setEditValues((v) =>
                              v
                                ? {
                                    ...v,
                                    status: e.target.value as "occupied" | "vacant",
                                    tenant_name: e.target.value === "occupied" ? v.tenant_name : "",
                                  }
                                : v
                            )
                          }
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="occupied">{t("occupied")}</option>
                          <option value="vacant">{t("vacant")}</option>
                        </select>
                      </div>
                      {editValues.status === "occupied" && (
                        <div className="col-span-2">
                          <label className="block mb-1 font-medium">{t("tenant")}</label>
                          <input
                            value={editValues.tenant_name}
                            onChange={(e) => setEditValues((v) => (v ? { ...v, tenant_name: e.target.value } : v))}
                            className="w-full border rounded px-2 py-1"
                            placeholder={t("tenant")}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block mb-1 font-medium">{t("rent")}</label>
                        <input
                          type="number"
                          value={editValues.rent_price}
                          onChange={(e) => setEditValues((v) => (v ? { ...v, rent_price: Number(e.target.value) } : v))}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-medium">{t("dueDay")}</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={editValues.due_day}
                          onChange={(e) => setEditValues((v) => (v ? { ...v, due_day: Number(e.target.value) } : v))}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        disabled={
                          updateMut.isPending ||
                          (editValues.status === "occupied" && !editValues.tenant_name.trim())
                        }
                        onClick={() => {
                          if (!editValues) return;
                          if (editValues.due_day < 1 || editValues.due_day > 31) {
                            push({ type: "error", message: t("errorDueDayRange") });
                            return;
                          }
                          const safeDue = Math.min(31, Math.max(1, editValues.due_day));
                          updateMut.mutate(
                            {
                              id: room.id,
                              patch: {
                                tenant_name:
                                  editValues.status === "occupied" ? editValues.tenant_name.trim() : null,
                                status: editValues.status,
                                rent_price: editValues.rent_price,
                                due_day: safeDue,
                              },
                            },
                            {
                              onSuccess: () => {
                                push({ type: "success", message: t("roomUpdated") });
                                setEditingId(null);
                                setEditValues(null);
                              },
                              onError: (e) =>
                                push({
                                  type: "error",
                                  message: e instanceof Error ? e.message : t("errorUpdateRoom"),
                                }),
                            }
                          );
                        }}
                        type="button"
                        className="flex-1 bg-green-600 text-white rounded px-3 py-1 text-[11px] disabled:opacity-50"
                      >
                        {t("save")}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditValues(null);
                        }}
                        type="button"
                        className="flex-1 bg-gray-300 text-gray-800 rounded px-3 py-1 text-[11px]"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        {!loading && roomsQuery.data && roomsQuery.data.length === 0 && (
          <p className="text-center text-xs text-gray-500">{t("noRooms")}</p>
        )}
      </div>
    </div>
  );
};

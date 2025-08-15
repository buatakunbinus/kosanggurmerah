import React, { useState } from "react";
import { useToast } from "../../ui/ToastProvider";
import type { Payment } from "../../types/models";
import { createPayment, updatePayment } from "./paymentService";
import { paymentRecordSchema, safeParse } from "../../utils/validation";
import { t } from "../../i18n/id";

interface Props {
  roomId: string;
  payment: Payment | undefined;
  amountDue: number;
  billingMonth: string; // YYYY-MM
  dueDay: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentRecordForm: React.FC<Props> = ({
  roomId,
  payment,
  amountDue,
  billingMonth,
  dueDay,
  onSuccess,
  onCancel,
}) => {
  const { push } = useToast();
  const todayIso = new Date().toISOString().slice(0, 10);
  const [amountPaid, setAmountPaid] = useState<number>(
    payment?.amount_paid || amountDue
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    payment?.payment_date || todayIso
  );
  const [method, setMethod] = useState<string>(payment?.method || "cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const parsed = safeParse(paymentRecordSchema, {
      amount_paid: amountPaid,
      payment_date: paymentDate,
      method,
    });
    if (!parsed.success) {
      setError(parsed.message);
      push({ type: "error", message: parsed.message });
      setLoading(false);
      return;
    }
    try {
      if (payment) {
        await updatePayment(payment.id, {
          amount_paid: amountPaid,
          payment_date: paymentDate,
          method,
          updated_at: new Date().toISOString(),
        });
      } else {
        // create payment record on the fly if missing
        const firstDay = `${billingMonth}-01`;
        const dueDate = new Date(firstDay + "T00:00:00");
        dueDate.setDate(dueDay);
        await createPayment({
          room_id: roomId,
          billing_month: firstDay,
          due_date: dueDate.toISOString().slice(0, 10),
          amount_due: amountDue,
          amount_paid: amountPaid,
          payment_date: paymentDate,
          method,
        });
      }
      push({
        type: "success",
        message: payment ? t("paymentUpdated") : t("paymentRecorded"),
      });
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errorSavingPayment");
      setError(msg);
      push({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 p-3 border rounded bg-white space-y-2 text-xs"
    >
      <div className="flex gap-2">
        <label className="flex-1">
          {t("amountPaid")}
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(Number(e.target.value))}
            className="mt-0.5 w-full border rounded px-2 py-1"
          />
        </label>
        <label className="flex-1">
          {t("date")}
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="mt-0.5 w-full border rounded px-2 py-1"
          />
        </label>
        <label className="flex-1">
          {t("method")}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-0.5 w-full border rounded px-2 py-1"
          >
            <option value="cash">{t("cash")}</option>
            <option value="transfer">{t("transfer")}</option>
            <option value="other">{t("other")}</option>
          </select>
        </label>
      </div>
      {error && (
        <div className="text-red-600" role="alert">
          {error}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded border text-gray-600 bg-gray-50 hover:bg-gray-100"
        >
          {t("cancel")}
        </button>
        <button
          disabled={loading}
          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? t("saving") : t("savePayment")}
        </button>
      </div>
    </form>
  );
};

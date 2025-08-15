import type { Payment, Room } from "../../types/models";

/** Shape of a new payment row prior to insertion (no id assigned yet). */
export interface NewPaymentRow extends Omit<Payment, "id"> {}

/**
 * Build the list of missing payment rows for the given month (YYYY-MM) given
 * the full set of occupied rooms and the set of room ids that already have a
 * payment record for that billing month.
 *
 * Pure / side‑effect free for easy unit testing; date generation can be made
 * deterministic via the `now` parameter.
 */
export function buildMissingPayments(
  month: string,
  rooms: Array<
    Pick<Room, "id" | "rent_price" | "status"> & { due_day?: number }
  >,
  existingRoomIds: Iterable<string>,
  now: Date = new Date()
): NewPaymentRow[] {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // JS Date month index
  const firstDayIso = `${month}-01`; // for billing_month field
  const existing = new Set(existingRoomIds);
  return rooms
    .filter((r) => r.status === "occupied" && !existing.has(r.id))
    .map((r) => {
      const boundedDay = Math.min(Math.max(r.due_day ?? 5, 1), 28);
      // Create date in UTC to avoid timezone shifting to previous/next day
      const dueDate = new Date(Date.UTC(year, monthIndex, boundedDay));
      const isoDue = dueDate.toISOString().slice(0, 10);
      const timestamp = now.toISOString();
      return {
        room_id: r.id,
        billing_month: firstDayIso,
        due_date: isoDue,
        amount_due: r.rent_price,
        amount_paid: 0,
        payment_date: null,
        method: null,
        created_at: timestamp,
        updated_at: timestamp,
      } satisfies NewPaymentRow;
    });
}

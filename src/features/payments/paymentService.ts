import { supabase } from "../../lib/supabaseClient";
import { Payment, Room } from "../../types/models";
export { derivePaymentStatus } from "./status";
import { buildMissingPayments } from "./generateLogic";

export async function listPayments(month?: string): Promise<Payment[]> {
  let query = supabase.from("payment").select("*");
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const nextMonth =
      m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    query = query
      .gte("billing_month", `${month}-01`)
      .lt("billing_month", `${nextMonth}-01`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Payment[];
}

export async function createPayment(
  payload: Omit<Payment, "id" | "created_at" | "updated_at">
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payment")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function updatePayment(
  id: string,
  patch: Partial<Omit<Payment, "id">>
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payment")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payment").delete().eq("id", id);
  if (error) throw error;
}

export async function generatePaymentsForMonth(month: string): Promise<number> {
  const firstDay = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const nextMonth =
    m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const { data: rooms, error: roomsError } = await supabase
    .from("room")
    .select("id, rent_price, due_day, status")
    .eq("status", "occupied");
  if (roomsError) throw roomsError;
  if (!rooms || rooms.length === 0) return 0;
  const { data: payments, error: payError } = await supabase
    .from("payment")
    .select("room_id")
    .gte("billing_month", firstDay)
    .lt("billing_month", `${nextMonth}-01`);
  if (payError) throw payError;
  type MinimalRoom = Pick<Room, "id" | "rent_price" | "due_day" | "status">;
  const toInsert = buildMissingPayments(
    month,
    rooms as MinimalRoom[],
    (payments || []).map((p) => (p as { room_id: string }).room_id)
  );
  if (toInsert.length === 0) return 0;
  const { error: insertError } = await supabase
    .from("payment")
    .insert(toInsert);
  if (insertError) throw insertError;
  return toInsert.length;
}

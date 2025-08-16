import { supabase } from "../../lib/supabaseClient";
import { Room } from "../../types/models";

// New alphanumeric room coding scheme:
// Floor 1: 1B - 1T (letters B..T)
// Floor 2: 2A - 2W (letters A..W)
// Floor 3: 3A - 3P (letters A..P)
function letterRange(start: string, end: string): string[] {
  const res: string[] = [];
  for (let c = start.charCodeAt(0); c <= end.charCodeAt(0); c++) {
    res.push(String.fromCharCode(c));
  }
  return res;
}
export const ROOM_CODES: string[] = [
  ...letterRange("B", "T").map((l) => `1${l}`),
  ...letterRange("A", "W").map((l) => `2${l}`),
  ...letterRange("A", "P").map((l) => `3${l}`),
];

function validateRoomNumber(num: string) {
  if (!ROOM_CODES.includes(num)) {
    throw new Error(
      "Invalid room code. Expected one of: " + ROOM_CODES.join(", ")
    );
  }
}

export async function listRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from("room")
    .select("*")
    .order("number");
  if (error) throw error;
  return data as Room[];
}

export async function createRoom(
  payload: Omit<Room, "id" | "created_at" | "updated_at">
): Promise<Room> {
  validateRoomNumber(payload.number);
  const { data, error } = await supabase
    .from("room")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Room;
}

export async function updateRoom(
  id: string,
  patch: Partial<Omit<Room, "id">>
): Promise<Room> {
  if (patch.number) validateRoomNumber(patch.number);
  const { data, error } = await supabase
    .from("room")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Room;
}

export async function deleteRoom(id: string): Promise<void> {
  // Manually delete dependent rows (payment, penalty) because FK is ON DELETE RESTRICT
  // room_occupancy uses ON DELETE CASCADE so no manual step needed.
  const paymentDel = await supabase.from("payment").delete().eq("room_id", id);
  if (paymentDel.error) throw paymentDel.error;
  const penaltyDel = await supabase.from("penalty").delete().eq("room_id", id);
  if (penaltyDel.error) throw penaltyDel.error;
  const { error } = await supabase.from("room").delete().eq("id", id);
  if (error) throw error;
}

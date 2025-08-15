import { supabase } from "../../lib/supabaseClient";
import { Room } from "../../types/models";

const ALL_ROOM_NUMBERS = Array.from({ length: 60 }, (_, i) =>
  (i + 1).toString().padStart(2, "0")
);
function validateRoomNumber(num: string) {
  if (!ALL_ROOM_NUMBERS.includes(num)) {
    throw new Error("Room number must be between 01 and 60");
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
  const { error } = await supabase.from("room").delete().eq("id", id);
  if (error) throw error;
}

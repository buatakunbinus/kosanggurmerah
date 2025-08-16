import { supabase } from "./supabaseClient";

/**
 * Partially reset data: delete penalties, expenses, room_occupancy, rooms.
 * Payments dibiarkan (history tetap ada) tapi akan orphan (FK restrict mencegah hapus room dulu),
 * jadi kita HAPUS payment yang terkait room yang akan dihapus? User minta tidak hapus pembayaran,
 * maka kita tidak bisa hapus room yang masih direferensikan payment (FK restrict). Untuk tetap
 * bisa hapus kamar, kita harus membatalkan permintaan "jangan hapus pembayaran" atau meng-archive.
 * Solusi kompromi: hapus penalties + expenses + occupancy saja (biarkan rooms & payments). Atau jika
 * harus hapus rooms juga, maka payment ikut terhapus. Di sini kita implement opsi parameter.
 */
export async function partialReset({ deleteRooms }: { deleteRooms: boolean }) {
  // Some projects mungkin belum punya 'room_occupancy', jadi kita lewati kalau tidak ada.
  async function wipe(table: string, usesCreatedAt = true) {
    try {
      const query = supabase.from(table).delete();
      const { error } = usesCreatedAt
        ? await query.gt("created_at", "1970-01-01")
        : await query;
      if (error) {
        // Skip missing table errors (schema cache not found)
        if (
          error.message.includes("Could not find the table") ||
          error.message.includes("does not exist")
        ) {
          return; // silently ignore
        }
        throw new Error(`[${table}] ${error.message}`);
      }
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        (e.message.includes("schema cache") ||
          e.message.includes("does not exist"))
      ) {
        return; // ignore missing table
      }
      throw e;
    }
  }
  // Order: child tables first
  await wipe("penalty");
  await wipe("expense");
  await wipe("room_occupancy"); // may not exist
  if (deleteRooms) {
    await wipe("payment");
    await wipe("room");
  }
}

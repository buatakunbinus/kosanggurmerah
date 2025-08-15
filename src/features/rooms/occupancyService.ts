import { supabase } from "../../lib/supabaseClient";

export interface RoomOccupancy {
  room_id: string;
  month: string; // YYYY-MM first day
  tenant_name: string;
  created_at: string;
}

function monthStart(month: string) {
  // month in YYYY-MM
  return `${month}-01`;
}

export async function setOccupantForMonth(
  room_id: string,
  month: string,
  tenant_name: string
) {
  const { error } = await supabase.from("room_occupancy").upsert({
    room_id,
    month: monthStart(month),
    tenant_name,
  });
  if (error) throw error;
}

export async function getOccupantHistory(
  room_id: string
): Promise<RoomOccupancy[]> {
  const { data, error } = await supabase
    .from("room_occupancy")
    .select("room_id, month, tenant_name, created_at")
    .eq("room_id", room_id)
    .order("month");
  if (error) throw error;
  return data as RoomOccupancy[];
}

export async function getOccupantsForRange(
  months: string[]
): Promise<Record<string, Record<string, string>>> {
  if (months.length === 0) return {};
  const monthDates = months.map((m) => `${m}-01`);
  const { data, error } = await supabase
    .from("room_occupancy")
    .select("room_id, month, tenant_name")
    .in("month", monthDates);
  if (error) throw error;
  const map: Record<string, Record<string, string>> = {};
  (data as RoomOccupancy[] | null)?.forEach((row) => {
    const m = row.month.slice(0, 7);
    (map[row.room_id] ||= {})[m] = row.tenant_name;
  });
  return map;
}

export async function getEffectiveOccupants(
  month: string
): Promise<Record<string, string>> {
  const target = `${month}-01`;
  const { data, error } = await supabase
    .from("room_occupancy")
    .select("room_id, month, tenant_name")
    .lte("month", target)
    .order("room_id", { ascending: true })
    .order("month", { ascending: false });
  if (error) throw error;
  const map: Record<string, string> = {};
  (data as RoomOccupancy[] | null)?.forEach((row) => {
    if (!(row.room_id in map)) {
      map[row.room_id] = row.tenant_name;
    }
  });
  return map;
}

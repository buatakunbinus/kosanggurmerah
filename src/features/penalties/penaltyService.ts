import { supabase } from "../../lib/supabaseClient";
import { Penalty } from "../../types/models";

export async function listPenalties(month?: string): Promise<Penalty[]> {
  let query = supabase.from("penalty").select("*");
  if (month) {
    query = query
      .gte("incident_date", `${month}-01`)
      .lt("incident_date", `${month}-31`);
  }
  const { data, error } = await query.order("incident_date");
  if (error) throw error;
  return data as Penalty[];
}

export async function createPenalty(
  payload: Omit<Penalty, "id" | "created_at">
): Promise<Penalty> {
  const { data, error } = await supabase
    .from("penalty")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Penalty;
}

export async function updatePenalty(
  id: string,
  patch: Partial<Omit<Penalty, "id">>
): Promise<Penalty> {
  const { data, error } = await supabase
    .from("penalty")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Penalty;
}

export async function deletePenalty(id: string): Promise<void> {
  const { error } = await supabase.from("penalty").delete().eq("id", id);
  if (error) throw error;
}

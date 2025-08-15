import { supabase } from "../../lib/supabaseClient";
import { Expense } from "../../types/models";

export async function listExpenses(month?: string): Promise<Expense[]> {
  let query = supabase.from("expense").select("*");
  if (month) {
    query = query.gte("date", `${month}-01`).lt("date", `${month}-31`);
  }
  const { data, error } = await query.order("date");
  if (error) throw error;
  return data as Expense[];
}

export async function createExpense(
  payload: Omit<Expense, "id" | "created_at">
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expense")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(
  id: string,
  patch: Partial<Omit<Expense, "id">>
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expense")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expense").delete().eq("id", id);
  if (error) throw error;
}

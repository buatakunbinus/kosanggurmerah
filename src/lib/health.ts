import { supabase } from "./supabaseClient";

/**
 * Perform a minimal Supabase connectivity check.
 * Returns ok:false with error message if the select fails.
 */
export async function supabaseHealthCheck(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from("room")
      .select("id", { count: "exact", head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

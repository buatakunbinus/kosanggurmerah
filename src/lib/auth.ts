import { supabase } from "./supabaseClient";

export async function signInEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function onAuthStateChange(cb: (signedIn: boolean) => void) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(!!session);
  });
  return () => sub.subscription.unsubscribe();
}

export async function signOut() {
  await supabase.auth.signOut();
}

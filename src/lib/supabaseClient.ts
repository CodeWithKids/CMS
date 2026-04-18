import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return typeof url === "string" ? url.trim() : "";
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return typeof key === "string" ? key.trim() : "";
}

export function isSupabaseEnabled(): boolean {
  return getSupabaseUrl().length > 0 && getSupabaseAnonKey().length > 0;
}

export const supabase: SupabaseClient | null = isSupabaseEnabled()
  ? createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

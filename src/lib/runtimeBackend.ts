import { isApiEnabled } from "@/lib/api";
import { isSupabaseEnabled } from "@/lib/supabaseClient";

/** True when any live backend is configured (no pure in-browser mock data mode). */
export function isHybridBackendConfigured(): boolean {
  return isSupabaseEnabled() || isApiEnabled();
}

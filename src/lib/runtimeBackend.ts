import { isApiEnabled } from "@/lib/api";
import { isSupabaseEnabled } from "@/lib/supabaseClient";

/** True when any live backend is configured (no pure in-browser mock data mode). */
export function isHybridBackendConfigured(): boolean {
  return isSupabaseEnabled() || isApiEnabled();
}

/**
 * Login UI: show email/password (Supabase or API), not the demo role picker.
 * Production builds always use this so public deployments are not stuck on demo mode when
 * env vars were omitted; local dev without a backend may still use the demo picker.
 */
export function shouldShowCredentialLoginForm(): boolean {
  return isHybridBackendConfigured() || import.meta.env.PROD;
}

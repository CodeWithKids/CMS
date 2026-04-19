/**
 * Delete a Supabase Auth user via the Hub API (GoTrue Admin). Service role stays on the server.
 * Requires VITE_API_URL and the Express route DELETE /v1/admin/supabase-auth-users/:userId.
 */
import { ApiError, getApiBaseUrl, isApiEnabled } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

export async function deleteSupabaseAuthUserViaApi(userId: string): Promise<void> {
  if (!isApiEnabled() || !supabase) {
    throw new ApiError(
      503,
      { message: "Hub API or Supabase session not available." },
      "Configure VITE_API_URL and sign in with Supabase to delete accounts."
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new ApiError(
      401,
      { message: "No Supabase session." },
      "Sign out and sign in again, then retry."
    );
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/v1/admin/supabase-auth-users/${encodeURIComponent(userId)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Network error";
    throw new ApiError(
      502,
      { message: `Could not reach the hub API (${detail}).` },
      `Could not reach the hub API (${detail}).`
    );
  }

  const json = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!res.ok) {
    const msg = json.message ?? `Delete failed (${res.status}).`;
    throw new ApiError(res.status >= 400 && res.status < 600 ? res.status : 400, { message: msg }, msg);
  }
}

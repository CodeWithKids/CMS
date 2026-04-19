/**
 * Shared Supabase user JWT verification + profiles.role lookup (service REST).
 * Used by provision routes and hybrid API auth when the SPA sends a Supabase session token.
 */
import jwt from "jsonwebtoken";

type JwtParts = {
  sub?: string;
  aud?: string;
};

export function supabaseProjectUrl(): string | undefined {
  const u = process.env.SUPABASE_URL?.trim();
  return u && u.length > 0 ? u.replace(/\/$/, "") : undefined;
}

/** Service role key — API host only; never expose to the browser. */
export function supabaseServiceRoleKey(): string | undefined {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return k && k.length > 0 ? k : undefined;
}

/** True when Supabase-backed routes can verify JWTs and read profiles via REST. */
export function supabaseProvisionEnvReady(): boolean {
  return !!(supabaseProjectUrl() && supabaseServiceRoleKey() && supabaseJwtSecret());
}

export function supabaseJwtSecret(): string | undefined {
  const k = process.env.SUPABASE_JWT_SECRET?.trim();
  return k && k.length > 0 ? k : undefined;
}

/** Decode Supabase Auth access JWT; returns auth user id (sub) or null. */
export function verifySupabaseUserAccessToken(token: string): string | null {
  const secret = supabaseJwtSecret();
  const base = supabaseProjectUrl();
  if (!secret || !base) return null;
  const issuer = `${base}/auth/v1`;
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      audience: "authenticated",
      issuer,
    }) as JwtParts;
    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        audience: "authenticated",
      }) as JwtParts;
      return typeof decoded.sub === "string" ? decoded.sub : null;
    } catch {
      return null;
    }
  }
}

/** Load profiles.role for a Supabase auth user id (requires service role on API host). */
export async function fetchProfileRole(userId: string): Promise<string | null> {
  const base = supabaseProjectUrl();
  const key = supabaseServiceRoleKey();
  if (!base || !key) return null;
  const url = `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json().catch(() => [])) as { role?: string }[];
  const role = rows[0]?.role;
  return typeof role === "string" ? role : null;
}

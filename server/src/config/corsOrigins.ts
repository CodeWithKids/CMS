/**
 * Browser origins allowed to call this API (CORS).
 * Set CORS_ORIGIN on whatever runs Express (Railway, Fly.io, VPS, Docker, etc.) — not on the static SPA host.
 * Comma-separated list, e.g. https://app.codewithkids.africa,https://your-hub.vercel.app
 */

const DEFAULT_PRODUCTION_ORIGINS = [
  "https://app.codewithkids.africa",
];

const DEV_BROWSER_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

function parseOriginsFromEnv(): string[] | null {
  const raw = process.env.CORS_ORIGIN;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const list = raw.split(",").map((o) => o.trim()).filter(Boolean);
  return list.length > 0 ? list : null;
}

/** For `cors({ origin })` — dev allows any origin. */
export function corsOriginOptionForExpress(): boolean | string[] {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) return true;
  return parseOriginsFromEnv() ?? DEFAULT_PRODUCTION_ORIGINS;
}

/** For error responses that must echo Access-Control-Allow-Origin when allowed. */
export function corsAllowedOriginsListForHeaders(): string[] {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) return DEV_BROWSER_ORIGINS;
  return parseOriginsFromEnv() ?? DEFAULT_PRODUCTION_ORIGINS;
}

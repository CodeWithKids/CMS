/**
 * Create Supabase Auth users with the GoTrue Admin API (no confirmation email when email_confirm is true).
 * Caller must present a valid Supabase user JWT; public.profiles.role must be admin.
 *
 * Env (API host only — never expose service role to the browser):
 *   SUPABASE_URL              e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API
 *   SUPABASE_JWT_SECRET       Dashboard → Settings → API → JWT Secret (signing secret for user JWTs)
 */
import { Router, type Request, type Response } from "express";
import { sendError } from "../middleware/error.js";
import {
  fetchProfileRole,
  supabaseProjectUrl,
  supabaseProvisionEnvReady,
  supabaseServiceRoleKey,
  verifySupabaseUserAccessToken,
} from "../supabaseJwt.js";

const router = Router();

const PROVISIONABLE_ROLES = [
  "admin",
  "educator",
  "finance",
  "partnerships",
  "marketing",
  "social_media",
  "ld_manager",
  "parent",
  "organisation",
] as const;

/** POST /v1/admin/provision-supabase-user */
router.post("/provision-supabase-user", async (req: Request, res: Response) => {
  const base = supabaseProjectUrl();
  const service = supabaseServiceRoleKey();
  if (!supabaseProvisionEnvReady() || !base || !service) {
    sendError(
      res,
      503,
      "NOT_CONFIGURED",
      "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET on the API server to provision users without signup emails."
    );
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    sendError(res, 401, "UNAUTHORIZED", "Missing Authorization Bearer token (Supabase session access token).");
    return;
  }

  const callerId = verifySupabaseUserAccessToken(token);
  if (!callerId) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid or expired Supabase session token.");
    return;
  }

  const callerRole = await fetchProfileRole(callerId);
  if (callerRole !== "admin") {
    sendError(res, 403, "FORBIDDEN", "Only admins can provision accounts.");
    return;
  }

  const body = req.body ?? {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";

  if (!email || !password || !name || !role) {
    sendError(res, 400, "VALIDATION_ERROR", "email, password, name, and role are required.");
    return;
  }
  if (!PROVISIONABLE_ROLES.includes(role as (typeof PROVISIONABLE_ROLES)[number])) {
    sendError(res, 400, "VALIDATION_ERROR", `role must be one of: ${PROVISIONABLE_ROLES.join(", ")}.`);
    return;
  }
  if (password.length < 6) {
    sendError(res, 400, "VALIDATION_ERROR", "Password must be at least 6 characters.");
    return;
  }

  const adminUrl = `${base}/auth/v1/admin/users`;
  const goTrueRes = await fetch(adminUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: service,
      Authorization: `Bearer ${service}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        name,
        role,
        status: "active",
      },
    }),
  });

  const json = (await goTrueRes.json().catch(() => ({}))) as {
    id?: string;
    msg?: string;
    message?: string;
    error_description?: string;
    error?: string;
  };

  if (!goTrueRes.ok) {
    const msg =
      json.msg ||
      json.message ||
      json.error_description ||
      json.error ||
      `GoTrue error (${goTrueRes.status}).`;
    sendError(res, goTrueRes.status >= 400 && goTrueRes.status < 600 ? goTrueRes.status : 400, "PROVISION_FAILED", msg);
    return;
  }

  const userId =
    typeof json.id === "string"
      ? json.id
      : typeof (json as { user?: { id?: string } }).user?.id === "string"
        ? (json as { user: { id: string } }).user.id
        : undefined;
  if (!userId) {
    sendError(res, 500, "INVALID_RESPONSE", "Admin user create succeeded but no user id was returned.");
    return;
  }

  res.status(201).json({ userId, email });
});

/** DELETE /v1/admin/supabase-auth-users/:userId — remove auth user (public.profiles cascades on delete). */
router.delete("/supabase-auth-users/:userId", async (req: Request, res: Response) => {
  const base = supabaseProjectUrl();
  const service = supabaseServiceRoleKey();
  if (!supabaseProvisionEnvReady() || !base || !service) {
    sendError(
      res,
      503,
      "NOT_CONFIGURED",
      "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET on the API server."
    );
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    sendError(res, 401, "UNAUTHORIZED", "Missing Authorization Bearer token (Supabase session access token).");
    return;
  }

  const callerId = verifySupabaseUserAccessToken(token);
  if (!callerId) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid or expired Supabase session token.");
    return;
  }

  const callerRole = await fetchProfileRole(callerId);
  if (callerRole !== "admin") {
    sendError(res, 403, "FORBIDDEN", "Only admins can delete accounts.");
    return;
  }

  const rawId = typeof req.params.userId === "string" ? req.params.userId.trim() : "";
  if (!rawId) {
    sendError(res, 400, "VALIDATION_ERROR", "user id is required.");
    return;
  }

  if (rawId === callerId) {
    sendError(res, 400, "VALIDATION_ERROR", "You cannot delete your own account.");
    return;
  }

  const adminDeleteUrl = `${base}/auth/v1/admin/users/${encodeURIComponent(rawId)}`;
  const goTrueRes = await fetch(adminDeleteUrl, {
    method: "DELETE",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
    },
  });

  if (goTrueRes.status === 404) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }

  const json = (await goTrueRes.json().catch(() => ({}))) as {
    msg?: string;
    message?: string;
    error_description?: string;
    error?: string;
  };

  if (!goTrueRes.ok) {
    const msg =
      json.msg ||
      json.message ||
      json.error_description ||
      json.error ||
      `GoTrue error (${goTrueRes.status}).`;
    sendError(res, goTrueRes.status >= 400 && goTrueRes.status < 600 ? goTrueRes.status : 400, "DELETE_FAILED", msg);
    return;
  }

  res.status(204).send();
});

export default router;

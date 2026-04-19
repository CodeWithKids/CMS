/**
 * Create Auth users + profiles via Supabase GoTrue (anon signup), without the Node API.
 * Used when `isSupabaseEnabled()` — see `public.handle_new_user` in `docs/SUPABASE_PROFILES_RLS.sql`
 * for `raw_user_meta_data.role`, `full_name` / `name`, and `status`.
 *
 * Requires Authentication → Providers → Email enabled, and "Allow new users to sign up" on
 * (or equivalent), since this uses the public anon key like any client sign-up.
 *
 * **Email rate limit:** Each `POST /auth/v1/signup` can trigger a confirmation email. Supabase’s
 * built-in email provider enforces a low hourly project cap (`Email rate limit exceeded`). Mitigations:
 * turn off **Confirm email** for local/dev (Dashboard → Authentication → Providers → Email), configure
 * **Custom SMTP** (Authentication), increase windows under **Authentication → Rate Limits**, or wait and retry.
 * **Bypass (recommended):** If `VITE_API_URL` points at this repo’s Express API and the API process has
 * `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`, the app calls
 * `POST /v1/admin/provision-supabase-user` with your Supabase session token so new users are created with
 * `email_confirm: true` and **no confirmation email** (avoids built-in SMTP rate limits). The service role
 * stays on the server only.
 */
import { ApiError, getApiBaseUrl, isApiEnabled } from "@/lib/api";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

const MIN_PASSWORD_LENGTH = 6;

const TEAM_AND_PARENT_ROLES = [
  "admin",
  "educator",
  "finance",
  "partnerships",
  "marketing",
  "social_media",
  "ld_manager",
  "parent",
] as const;

type GoTrueSignupResponse = {
  user?: { id?: string; email?: string } | null;
  /** Some GoTrue versions return the user id at the top level on success. */
  id?: string;
  email?: string;
  /** Present when signup returns tokens without a fully populated user object. */
  access_token?: string;
  session?: {
    access_token?: string;
    user?: { id?: string; email?: string } | null;
  } | null;
  msg?: string;
  error?: string;
  error_description?: string;
  message?: string;
};

/** Auth user id from JWT `sub` when GoTrue returns only access_token/session. */
function userIdFromAccessToken(accessToken: string | undefined): string | undefined {
  if (!accessToken || typeof accessToken !== "string") return undefined;
  const parts = accessToken.split(".");
  if (parts.length < 2) return undefined;
  try {
    const segment = parts[1];
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as { sub?: string };
    return typeof payload.sub === "string" && payload.sub.length > 0 ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

/** GoTrue `/signup` success bodies vary by version and email-confirm settings. */
function extractUserIdFromSignupResponse(json: GoTrueSignupResponse): string | undefined {
  const fromUser = json.user?.id;
  if (typeof fromUser === "string" && fromUser.length > 0) return fromUser;

  const top = json.id;
  if (typeof top === "string" && top.length > 0) return top;

  const fromSession = json.session?.user?.id;
  if (typeof fromSession === "string" && fromSession.length > 0) return fromSession;

  const token =
    typeof json.access_token === "string" && json.access_token.length > 0
      ? json.access_token
      : typeof json.session?.access_token === "string" && json.session.access_token.length > 0
        ? json.session.access_token
        : undefined;
  return userIdFromAccessToken(token);
}

function extractEmailFromSignupResponse(json: GoTrueSignupResponse, fallback: string): string {
  if (typeof json.user?.email === "string" && json.user.email.length > 0) return json.user.email;
  if (typeof json.email === "string" && json.email.length > 0) return json.email;
  if (typeof json.session?.user?.email === "string" && json.session.user.email.length > 0) {
    return json.session.user.email;
  }
  return fallback;
}

function friendlyGoTrueSignupError(raw: string): string {
  const s = raw.trim();
  const lower = s.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("email rate")) {
    return [
      "Supabase stopped this sign-up because too many auth emails were sent recently (built-in email provider limit).",
      "Fix: In the Supabase Dashboard go to Authentication → Providers → Email and disable Confirm email for development, or add Custom SMTP under Project Settings → Authentication, or wait an hour and try again.",
      "Details: https://supabase.com/docs/guides/auth/rate-limits",
      "If you run the CWK Hub API (VITE_API_URL), set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET on the server so educator/parent/team creation uses the Admin API instead of public sign-up.",
    ].join(" ");
  }
  return s;
}

function assertConfigured(): void {
  if (!isSupabaseEnabled()) {
    throw new ApiError(503, { message: "Supabase is not configured." }, "Supabase is not configured.");
  }
}

/**
 * When the Express API is configured with Supabase service credentials, creates the auth user
 * without sending a confirmation email (avoids rate limits).
 *
 * Returns `null` only when **`VITE_API_URL` is not set** so callers may fall back to public sign-up.
 * If `VITE_API_URL` **is** set, failures throw (we do not fall back to anon sign-up, which would hit
 * the same email rate limits and hide misconfiguration).
 */
async function tryProvisionAuthUserViaApi(input: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<{ userId: string } | null> {
  if (!isApiEnabled()) return null;
  const base = getApiBaseUrl();
  if (!base) return null;
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new ApiError(
      401,
      { message: "No Supabase session. Sign out and sign in again, then create the account." },
      "No Supabase session. Sign out and sign in again, then create the account."
    );
  }

  const url = `${base.replace(/\/$/, "")}/v1/admin/provision-supabase-user`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Network error";
    throw new ApiError(
      502,
      {
        message: `Could not reach the hub API at ${base} (${detail}). Start the API (e.g. npm run dev in server/) and ensure CORS_ORIGIN includes this app.`,
      },
      `Could not reach the hub API (${detail}). Is the server running?`
    );
  }

  const json = (await res.json().catch(() => ({}))) as {
    userId?: string;
    code?: string;
    message?: string;
  };

  if (res.status === 503 && json.code === "NOT_CONFIGURED") {
    throw new ApiError(
      503,
      {
        message:
          "The hub API is running but cannot provision Supabase users yet. On the API host, set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET (see server/.env.example), restart the API, then try again. Public sign-up was not used so you are not stuck behind email rate limits.",
      },
      json.message ??
        "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET on the API server."
    );
  }
  if (res.status === 401 || res.status === 403) {
    const msg = json.message ?? "Not allowed to provision users.";
    throw new ApiError(res.status, { message: msg }, msg);
  }
  if (!res.ok) {
    const msg = json.message ?? `Provision failed (${res.status}).`;
    throw new ApiError(res.status, { message: msg }, msg);
  }
  if (!json.userId) {
    throw new ApiError(500, { message: "Provision returned no user id." }, "Provision returned no user id.");
  }
  return { userId: json.userId };
}

async function authSignUpWithAnonKey(body: {
  email: string;
  password: string;
  data: Record<string, string>;
}): Promise<{ userId: string; email: string }> {
  const base = getSupabaseUrl().replace(/\/$/, "");
  const anon = getSupabaseAnonKey();
  const res = await fetch(`${base}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      data: body.data,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as GoTrueSignupResponse;

  if (!res.ok) {
    const raw =
      json.msg ||
      json.message ||
      json.error_description ||
      json.error ||
      res.statusText ||
      "Sign up failed.";
    const msg = friendlyGoTrueSignupError(raw);
    throw new ApiError(res.status, { message: msg }, msg);
  }

  const userId = extractUserIdFromSignupResponse(json);
  if (!userId) {
    throw new ApiError(
      500,
      {
        message:
          "Sign up succeeded but no user id was returned. If Confirm email is on in Supabase, set VITE_API_URL and the hub API env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET) so users are created via the Admin API, or temporarily disable Confirm email for development.",
      },
      "Sign up succeeded but no user id was returned."
    );
  }
  return { userId, email: extractEmailFromSignupResponse(json, body.email) };
}

export async function adminCreateTeamMemberSupabase(input: {
  name: string;
  email: string;
  role: string;
  password: string;
}): Promise<void> {
  assertConfigured();
  const { name, email, role, password } = input;
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }
  if (!TEAM_AND_PARENT_ROLES.includes(role as (typeof TEAM_AND_PARENT_ROLES)[number])) {
    throw new ApiError(400, { message: "Invalid role for team account." }, "Invalid role for team account.");
  }
  const provisioned = await tryProvisionAuthUserViaApi({
    email: email.trim(),
    password,
    name: name.trim(),
    role: role.trim(),
  });
  if (provisioned) return;
  await authSignUpWithAnonKey({
    email: email.trim(),
    password,
    data: {
      full_name: name.trim(),
      name: name.trim(),
      role: role.trim(),
      status: "active",
    },
  });
}

export async function adminCreateParentSupabase(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  assertConfigured();
  const { name, email, password } = input;
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }
  const provisioned = await tryProvisionAuthUserViaApi({
    email: email.trim(),
    password,
    name: name.trim(),
    role: "parent",
  });
  if (provisioned) return;
  await authSignUpWithAnonKey({
    email: email.trim(),
    password,
    data: {
      full_name: name.trim(),
      name: name.trim(),
      role: "parent",
      status: "active",
    },
  });
}

export async function adminCreateOrganisationAccountSupabase(input: {
  organisationName: string;
  type: "school" | "organisation" | "miradi" | "other";
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string | null;
  location?: string | null;
  password: string;
}): Promise<void> {
  assertConfigured();
  if (!supabase) throw new ApiError(503, { message: "Supabase client missing." }, "Supabase client missing.");

  const {
    organisationName,
    type,
    contactPerson,
    contactEmail,
    contactPhone,
    location,
    password,
  } = input;

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }

  let userId: string;
  const provisioned = await tryProvisionAuthUserViaApi({
    email: contactEmail.trim(),
    password,
    name: contactPerson.trim(),
    role: "organisation",
  });
  if (provisioned) {
    userId = provisioned.userId;
  } else {
    const created = await authSignUpWithAnonKey({
      email: contactEmail.trim(),
      password,
      data: {
        full_name: contactPerson.trim(),
        name: contactPerson.trim(),
        role: "organisation",
        status: "active",
      },
    });
    userId = created.userId;
  }

  const orgId = crypto.randomUUID();

  const orgRow = {
    id: orgId,
    name: organisationName.trim(),
    type,
    contact_person: contactPerson.trim(),
    contact_email: contactEmail.trim(),
    contact_phone: contactPhone?.trim() || null,
    location: (location ?? "").trim() || "",
  };

  const { error: orgError } = await supabase.from("organisations").insert(orgRow);
  if (orgError) {
    throw new ApiError(
      400,
      {
        message: `Auth user was created but organisation row failed: ${orgError.message}. Check that public.organisations exists and RLS allows admin inserts, or link the user manually in SQL.`,
      },
      orgError.message
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: orgId })
    .eq("id", userId);

  if (profileError) {
    throw new ApiError(
      400,
      {
        message: `Organisation created but could not link user profile: ${profileError.message}. Run section 6 of SUPABASE_PROFILES_RLS.sql so admins can update profiles, or set organization_id in SQL.`,
      },
      profileError.message
    );
  }
}

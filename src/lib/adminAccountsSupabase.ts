/**
 * Create Auth users + profiles via Supabase GoTrue (anon signup), without the Node API.
 * Used when `isSupabaseEnabled()` — see `public.handle_new_user` in `docs/SUPABASE_PROFILES_RLS.sql`
 * for `raw_user_meta_data.role`, `full_name` / `name`, and `status`.
 *
 * Requires Authentication → Providers → Email enabled, and "Allow new users to sign up" on
 * (or equivalent), since this uses the public anon key like any client sign-up.
 */
import { ApiError } from "@/lib/api";
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
  id?: string;
  msg?: string;
  error?: string;
  error_description?: string;
  message?: string;
};

function assertConfigured(): void {
  if (!isSupabaseEnabled()) {
    throw new ApiError(503, { message: "Supabase is not configured." }, "Supabase is not configured.");
  }
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
    const msg =
      json.msg ||
      json.message ||
      json.error_description ||
      json.error ||
      res.statusText ||
      "Sign up failed.";
    throw new ApiError(res.status, { message: msg }, msg);
  }

  const userId = json.user?.id;
  if (!userId) {
    throw new ApiError(
      500,
      { message: "Sign up succeeded but no user id was returned." },
      "Sign up succeeded but no user id was returned."
    );
  }
  return { userId, email: json.user?.email ?? body.email };
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

  const { userId } = await authSignUpWithAnonKey({
    email: contactEmail.trim(),
    password,
    data: {
      full_name: contactPerson.trim(),
      name: contactPerson.trim(),
      role: "organisation",
      status: "active",
    },
  });

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

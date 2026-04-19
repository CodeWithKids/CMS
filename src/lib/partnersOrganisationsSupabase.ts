/**
 * Organisation partners on Supabase (`public.organisations`). Used when Prisma API is off.
 */
import { ApiError } from "@/lib/api";
import type { OrganisationPartnerApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

type OrgRow = {
  id: string;
  name: string;
  type?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  location?: string | null;
  created_at?: string | null;
};

function mapRow(o: OrgRow): OrganisationPartnerApi {
  const created =
    typeof o.created_at === "string" && o.created_at.length > 0
      ? o.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  return {
    id: o.id,
    name: o.name,
    type: o.type ?? "",
    contactPerson: o.contact_person ?? "",
    contactEmail: o.contact_email ?? null,
    contactPhone: o.contact_phone ?? null,
    location: o.location ?? "",
    status: "active",
    createdAt: created,
  };
}

export async function listOrganisationPartnersSupabase(): Promise<OrganisationPartnerApi[]> {
  if (!isSupabaseEnabled() || !supabase) {
    throw new ApiError(503, { message: "Supabase is not configured." }, "Supabase is not configured.");
  }
  const { data, error } = await supabase.from("organisations").select("*").order("name", { ascending: true });
  if (error) {
    throw new ApiError(400, { message: error.message }, error.message);
  }
  return ((data as OrgRow[] | null) ?? []).map(mapRow);
}

/**
 * Delete an organisation row. Mirrors Express: block if learners reference this org; unlink profiles first.
 */
export async function deleteOrganisationPartnerSupabase(orgId: string): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) {
    throw new ApiError(503, { message: "Supabase is not configured." }, "Supabase is not configured.");
  }

  const { count, error: countError } = await supabase
    .from("learners")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (countError) {
    throw new ApiError(400, { message: countError.message }, countError.message);
  }
  if ((count ?? 0) > 0) {
    throw new ApiError(
      400,
      {
        message:
          "Cannot delete this partner while learners are linked. Reassign or remove those learners first.",
      },
      "Cannot delete this partner while learners are linked."
    );
  }

  const { error: unlinkErr } = await supabase.from("profiles").update({ organization_id: null }).eq("organization_id", orgId);
  if (unlinkErr) {
    throw new ApiError(400, { message: unlinkErr.message }, unlinkErr.message);
  }

  const { error: delErr } = await supabase.from("organisations").delete().eq("id", orgId);
  if (delErr) {
    throw new ApiError(400, { message: delErr.message }, delErr.message);
  }
}

export async function updateOrganisationPartnerSupabase(
  orgId: string,
  body: {
    name: string;
    type?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    location?: string;
  }
): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) {
    throw new ApiError(503, { message: "Supabase is not configured." }, "Supabase is not configured.");
  }
  const row: Record<string, unknown> = { name: body.name };
  if (body.type !== undefined) row.type = body.type;
  if (body.contactPerson !== undefined) row.contact_person = body.contactPerson;
  if (body.contactEmail !== undefined) row.contact_email = body.contactEmail;
  if (body.contactPhone !== undefined) row.contact_phone = body.contactPhone;
  if (body.location !== undefined) row.location = body.location;

  const { error } = await supabase.from("organisations").update(row).eq("id", orgId);
  if (error) {
    throw new ApiError(400, { message: error.message }, error.message);
  }
}

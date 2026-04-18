/**
 * Admin Settings reference lists (terms, programs, locations, age groups, income sources, expense categories)
 * via Supabase when the Node API is not used. Matches snake_case tables in docs/SUPABASE_SETTINGS_REFERENCE_RLS.sql.
 */
import { supabase } from "@/lib/supabaseClient";
import type { TermApi, ProgramApi, LocationApi, AgeGroupApi, IncomeSourceApi, ExpenseCategoryApi } from "@/lib/api";

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ——— Terms (public.terms — see docs/SUPABASE_TERMS_RLS.sql) ———

export async function supabaseTermsList(): Promise<TermApi[]> {
  const { data, error } = await client().from("terms").select("*").order("start_date", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    startDate: String(r.start_date ?? r.startDate ?? ""),
    endDate: String(r.end_date ?? r.endDate ?? ""),
    isCurrent: r.is_current === true || r.isCurrent === true,
  }));
}

async function clearAllTermsNotCurrent(): Promise<void> {
  const { error } = await client().from("terms").update({ is_current: false }).neq("id", "");
  if (error) throw error;
}

export async function supabaseTermsCreate(body: {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}): Promise<void> {
  if (body.isCurrent) await clearAllTermsNotCurrent();
  const id = nextId("t");
  const { error } = await client().from("terms").insert({
    id,
    name: body.name,
    start_date: body.startDate,
    end_date: body.endDate,
    is_current: body.isCurrent ?? false,
  });
  if (error) throw error;
}

export async function supabaseTermsPatch(
  id: string,
  body: Partial<{ name: string; startDate: string; endDate: string; isCurrent: boolean }>
): Promise<void> {
  if (body.isCurrent === true) await clearAllTermsNotCurrent();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.startDate !== undefined) patch.start_date = body.startDate;
  if (body.endDate !== undefined) patch.end_date = body.endDate;
  if (body.isCurrent !== undefined) patch.is_current = body.isCurrent;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client().from("terms").update(patch).eq("id", id);
  if (error) throw error;
}

export async function supabaseTermsDelete(id: string): Promise<void> {
  const { error } = await client().from("terms").delete().eq("id", id);
  if (error) throw error;
}

// ——— Programs ———

function mapProgramRow(r: Record<string, unknown>): ProgramApi {
  const trackRaw = r.track_id ?? r.trackId;
  const trackId = trackRaw != null && String(trackRaw).trim() !== "" ? String(trackRaw) : null;
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    description: (r.description as string | null | undefined) ?? null,
    trackId,
  };
}

export async function supabaseProgramsList(): Promise<ProgramApi[]> {
  const { data, error } = await client().from("programs").select("*").order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(mapProgramRow);
}

export async function supabaseProgramsCreate(body: {
  name: string;
  description?: string | null;
  trackId?: string | null;
}): Promise<void> {
  const id = nextId("prog");
  const { error } = await client().from("programs").insert({
    id,
    name: body.name,
    description: body.description ?? null,
    track_id: body.trackId ?? null,
  });
  if (error) throw error;
}

export async function supabaseProgramsPatch(
  id: string,
  body: Partial<{ name: string; description: string | null; trackId: string | null }>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.trackId !== undefined) patch.track_id = body.trackId;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client().from("programs").update(patch).eq("id", id);
  if (error) throw error;
}

export async function supabaseProgramsDelete(id: string): Promise<void> {
  const { error } = await client().from("programs").delete().eq("id", id);
  if (error) throw error;
}

// ——— Locations ———

function mapLocationRow(r: Record<string, unknown>): LocationApi {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    address: (r.address as string | null | undefined) ?? null,
  };
}

export async function supabaseLocationsList(): Promise<LocationApi[]> {
  const { data, error } = await client().from("locations").select("*").order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(mapLocationRow);
}

export async function supabaseLocationsCreate(body: { name: string; address?: string | null }): Promise<void> {
  const id = nextId("loc");
  const { error } = await client().from("locations").insert({
    id,
    name: body.name,
    address: body.address ?? null,
  });
  if (error) throw error;
}

export async function supabaseLocationsPatch(id: string, body: Partial<{ name: string; address: string | null }>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.address !== undefined) patch.address = body.address;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client().from("locations").update(patch).eq("id", id);
  if (error) throw error;
}

export async function supabaseLocationsDelete(id: string): Promise<void> {
  const { error } = await client().from("locations").delete().eq("id", id);
  if (error) throw error;
}

// ——— Age groups ———

function mapAgeGroupRow(r: Record<string, unknown>): AgeGroupApi {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    minAge: r.min_age != null ? Number(r.min_age) : r.minAge != null ? Number(r.minAge) : null,
    maxAge: r.max_age != null ? Number(r.max_age) : r.maxAge != null ? Number(r.maxAge) : null,
  };
}

export async function supabaseAgeGroupsList(): Promise<AgeGroupApi[]> {
  const { data, error } = await client().from("age_groups").select("*").order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(mapAgeGroupRow);
}

export async function supabaseAgeGroupsCreate(body: { name: string; minAge?: number | null; maxAge?: number | null }): Promise<void> {
  const id = nextId("ag");
  const { error } = await client().from("age_groups").insert({
    id,
    name: body.name,
    min_age: body.minAge ?? null,
    max_age: body.maxAge ?? null,
  });
  if (error) throw error;
}

export async function supabaseAgeGroupsPatch(
  id: string,
  body: Partial<{ name: string; minAge: number | null; maxAge: number | null }>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.minAge !== undefined) patch.min_age = body.minAge;
  if (body.maxAge !== undefined) patch.max_age = body.maxAge;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client().from("age_groups").update(patch).eq("id", id);
  if (error) throw error;
}

export async function supabaseAgeGroupsDelete(id: string): Promise<void> {
  const { error } = await client().from("age_groups").delete().eq("id", id);
  if (error) throw error;
}

// ——— Income sources ———

function mapIncomeSourceRow(r: Record<string, unknown>): IncomeSourceApi {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    code: (r.code as string | null | undefined) ?? null,
  };
}

export async function supabaseIncomeSourcesList(): Promise<IncomeSourceApi[]> {
  const { data, error } = await client().from("income_sources").select("*").order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(mapIncomeSourceRow);
}

export async function supabaseIncomeSourcesCreate(body: { name: string; code?: string | null }): Promise<void> {
  const id = nextId("inc");
  const { error } = await client().from("income_sources").insert({
    id,
    name: body.name,
    code: body.code ?? null,
  });
  if (error) throw error;
}

export async function supabaseIncomeSourcesPatch(id: string, body: Partial<{ name: string; code: string | null }>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.code !== undefined) patch.code = body.code;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client().from("income_sources").update(patch).eq("id", id);
  if (error) throw error;
}

export async function supabaseIncomeSourcesDelete(id: string): Promise<void> {
  const { error } = await client().from("income_sources").delete().eq("id", id);
  if (error) throw error;
}

// ——— Expense categories ———

function mapExpenseCategoryRow(r: Record<string, unknown>): ExpenseCategoryApi {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    code: (r.code as string | null | undefined) ?? null,
  };
}

export async function supabaseExpenseCategoriesList(): Promise<ExpenseCategoryApi[]> {
  const { data, error } = await client().from("expense_categories").select("*").order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(mapExpenseCategoryRow);
}

export async function supabaseExpenseCategoriesCreate(body: { name: string; code?: string | null }): Promise<void> {
  const id = nextId("exp");
  const { error } = await client().from("expense_categories").insert({
    id,
    name: body.name,
    code: body.code ?? null,
  });
  if (error) throw error;
}

export async function supabaseExpenseCategoriesPatch(id: string, body: Partial<{ name: string; code: string | null }>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.code !== undefined) patch.code = body.code;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client().from("expense_categories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function supabaseExpenseCategoriesDelete(id: string): Promise<void> {
  const { error } = await client().from("expense_categories").delete().eq("id", id);
  if (error) throw error;
}

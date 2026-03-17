/**
 * API client for CWK Hub backend.
 * Set VITE_API_URL (e.g. http://localhost:3001) to use the real API; otherwise mocks are used.
 */

const STORAGE_TOKEN_KEY = "cwk_token";

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  return typeof url === "string" ? url.trim() : "";
}

export function isApiEnabled(): boolean {
  return getApiBaseUrl().length > 0;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
    message = body?.message ?? `Request failed with status ${status}`
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: T | ApiErrorBody;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = { message: text || res.statusText } as ApiErrorBody;
  }
  if (!res.ok) {
    throw new ApiError(res.status, data as ApiErrorBody, (data as ApiErrorBody)?.message);
  }
  return data as T;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL not set (VITE_API_URL)");

  const { body, token, headers: optHeaders, ...rest } = options;
  const tokenToUse = token !== undefined ? token : getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(optHeaders as Record<string, string>),
  };
  if (tokenToUse) headers.Authorization = `Bearer ${tokenToUse}`;

  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // On 401, clear token and notify app so user is logged out and redirected to login
  if (res.status === 401) {
    clearAccessToken();
    try {
      sessionStorage.setItem("cwk_session_expired", "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
  return parseResponse<T>(res);
}

// ——— Auth ———
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    role: string;
    email: string | null;
    status: string | null;
    organizationId: string | null;
    membershipStatus: string | null;
    avatarId: string | null;
  };
}

export function authLogin(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/v1/auth/login", {
    method: "POST",
    body: { email, password },
    token: null,
  });
}

export function authMe(token: string): Promise<LoginResponse["user"]> {
  return apiFetch<LoginResponse["user"]>("/v1/auth/me", { token });
}

export function authLogout(): Promise<void> {
  const base = getApiBaseUrl();
  const token = getAccessToken();
  if (!base || !token) return Promise.resolve();
  return apiFetch<void>("/v1/auth/logout", { method: "POST", body: {}, token }).catch(() => undefined);
}

// ——— Finance (invoices & payments) ———
export interface FinanceInvoiceApi {
  id: string;
  payerType: string;
  payerId: string;
  learnerId?: string | null;
  organisationId?: string | null;
  termId: string;
  programmeId?: string | null;
  trackId?: string | null;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  dueDate: string;
  issueDate: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface PaymentApi {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string | null;
  date: string;
  recordedBy: string;
  createdAt: string;
}

export function financeGetInvoices(params?: { termId?: string; status?: string; payerType?: string }): Promise<FinanceInvoiceApi[]> {
  const q = new URLSearchParams();
  if (params?.termId) q.set("termId", params.termId);
  if (params?.status) q.set("status", params.status);
  if (params?.payerType) q.set("payerType", params.payerType);
  const query = q.toString();
  return apiFetch<FinanceInvoiceApi[]>(`/v1/finance/invoices${query ? `?${query}` : ""}`);
}

export function financeGetInvoice(id: string): Promise<FinanceInvoiceApi | null> {
  return apiFetch<FinanceInvoiceApi>(`/v1/finance/invoices/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function financeGetPayments(invoiceId: string): Promise<PaymentApi[]> {
  return apiFetch<PaymentApi[]>(`/v1/finance/invoices/${invoiceId}/payments`);
}

export function financeRecordPayment(
  invoiceId: string,
  payload: { amount: number; method: string; reference?: string; date: string; recordedBy: string }
): Promise<PaymentApi> {
  return apiFetch<PaymentApi>(`/v1/finance/invoices/${invoiceId}/payments`, {
    method: "POST",
    body: payload,
  });
}

// ——— Events ———

export interface EventApi {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  location: string;
  capacity?: number | null;
  price?: number | null;
  tracks: string[];
  status: string;
}

export function eventsGetAll(params?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<EventApi[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params?.dateTo) q.set("dateTo", params.dateTo);
  const query = q.toString();
  return apiFetch<EventApi[]>(`/v1/events${query ? `?${query}` : ""}`);
}

export function eventsGetBySlug(slug: string): Promise<EventApi | null> {
  return apiFetch<EventApi>(`/v1/events/${slug}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function eventsCreate(body: {
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  location: string;
  capacity?: number | null;
  price?: number | null;
  tracks?: string[];
  status?: string;
  createdById?: string;
}): Promise<EventApi> {
  return apiFetch<EventApi>("/v1/events", {
    method: "POST",
    body,
  });
}

export function eventsUpdate(
  slug: string,
  body: Partial<{
    title: string;
    slug: string;
    description: string;
    startDate: string;
    endDate: string | null;
    location: string;
    capacity: number | null;
    price: number | null;
    tracks: string[];
    status: string;
  }>
): Promise<EventApi> {
  return apiFetch<EventApi>(`/v1/events/${slug}`, {
    method: "PATCH",
    body,
  });
}

// ——— Educator payments (finance) ———

export interface EducatorPaymentApi {
  id: string;
  educatorId: string;
  period: string;
  type: string;
  amount: number;
  status: string;
  datePaid?: string | null;
  notes?: string | null;
}

export function financeEducatorPaymentsGetAll(params?: {
  educatorId?: string;
  period?: string;
  status?: string;
}): Promise<EducatorPaymentApi[]> {
  const q = new URLSearchParams();
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  if (params?.period) q.set("period", params.period);
  if (params?.status) q.set("status", params.status);
  const query = q.toString();
  return apiFetch<EducatorPaymentApi[]>(`/v1/finance/educator-payments${query ? `?${query}` : ""}`);
}

// ——— Inventory ———

export interface InventoryItemApi {
  id: string;
  name: string;
  category: string;
  status: string;
  serialNumber?: string | null;
  purchasedAt?: string | null;
  checkedOutByEducatorId?: string | null;
  assignedEducatorId?: string | null;
  checkedOutAt?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}

export function inventoryGetAll(params?: {
  status?: string;
  category?: string;
  educatorId?: string;
}): Promise<InventoryItemApi[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.category) q.set("category", params.category);
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  const query = q.toString();
  return apiFetch<InventoryItemApi[]>(`/v1/inventory/items${query ? `?${query}` : ""}`);
}

export function inventoryCreate(body: {
  id?: string;
  name: string;
  category: string;
  status?: string;
  serialNumber?: string | null;
  purchasedAt?: string | null;
  notes?: string | null;
}): Promise<InventoryItemApi> {
  return apiFetch<InventoryItemApi>("/v1/inventory/items", {
    method: "POST",
    body,
  });
}

export function inventoryUpdate(
  id: string,
  body: Partial<{
    name: string;
    category: string;
    status: string;
    serialNumber: string | null;
    purchasedAt: string | null;
    checkedOutByEducatorId: string | null;
    assignedEducatorId: string | null;
    checkedOutAt: string | null;
    dueAt: string | null;
    notes: string | null;
  }>
): Promise<InventoryItemApi> {
  return apiFetch<InventoryItemApi>(`/v1/inventory/items/${id}`, {
    method: "PATCH",
    body,
  });
}

export function inventoryDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/inventory/items/${id}`, {
    method: "DELETE",
  });
}

// ——— Lesson plans & coaching notes ———

export interface LessonPlanTemplateApi {
  id: string;
  learningTrackId: string;
  title: string;
  payload: unknown;
}

export interface LessonPlanInstanceApi {
  id: string;
  sessionId: string;
  templateId?: string | null;
  status: string;
  payload: unknown;
  educatorId?: string | null;
}

export interface CoachingNoteApi {
  id: string;
  educatorId: string;
  authorId: string;
  date: string;
  text: string;
  trackRef?: string | null;
  sessionId?: string | null;
  createdAt: string;
}

export function lessonPlanTemplatesGetAll(): Promise<LessonPlanTemplateApi[]> {
  return apiFetch<LessonPlanTemplateApi[]>("/v1/lesson-plans/templates");
}

export function lessonPlanInstancesGetAll(params?: {
  sessionId?: string;
  educatorId?: string;
}): Promise<LessonPlanInstanceApi[]> {
  const q = new URLSearchParams();
  if (params?.sessionId) q.set("sessionId", params.sessionId);
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  const query = q.toString();
  return apiFetch<LessonPlanInstanceApi[]>(`/v1/lesson-plans/instances${query ? `?${query}` : ""}`);
}

export function lessonPlanInstanceCreate(body: {
  id?: string;
  sessionId: string;
  templateId?: string | null;
  status?: string;
  payload?: unknown;
  educatorId?: string | null;
}): Promise<LessonPlanInstanceApi> {
  return apiFetch<LessonPlanInstanceApi>("/v1/lesson-plans/instances", {
    method: "POST",
    body,
  });
}

export function lessonPlanInstanceUpdate(
  id: string,
  body: Partial<{ status: string; payload: unknown; templateId: string | null }>
): Promise<LessonPlanInstanceApi> {
  return apiFetch<LessonPlanInstanceApi>(`/v1/lesson-plans/instances/${id}`, {
    method: "PATCH",
    body,
  });
}

export function coachingNotesGetAll(params?: { educatorId?: string }): Promise<CoachingNoteApi[]> {
  const q = new URLSearchParams();
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  const query = q.toString();
  return apiFetch<CoachingNoteApi[]>(`/v1/coaching-notes${query ? `?${query}` : ""}`);
}

export function coachingNotesCreate(body: {
  educatorId: string;
  authorId: string;
  date?: string;
  text: string;
  trackRef?: string | null;
  sessionId?: string | null;
}): Promise<CoachingNoteApi> {
  return apiFetch<CoachingNoteApi>("/v1/coaching-notes", {
    method: "POST",
    body,
  });
}

// ——— Terms ———
export interface TermApi {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export function termsGetAll(): Promise<TermApi[]> {
  return apiFetch<TermApi[]>("/v1/terms");
}

export function termsGetCurrent(): Promise<TermApi | null> {
  return apiFetch<TermApi>("/v1/terms/current").catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function termsCreate(body: { name: string; startDate: string; endDate: string; isCurrent?: boolean }): Promise<TermApi> {
  return apiFetch<TermApi>("/v1/terms", { method: "POST", body });
}

export function termsPatch(
  id: string,
  body: Partial<{ name: string; startDate: string; endDate: string; isCurrent: boolean }>
): Promise<TermApi> {
  return apiFetch<TermApi>(`/v1/terms/${id}`, { method: "PATCH", body });
}

export function termsDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/terms/${id}`, { method: "DELETE" });
}

// ——— Programs (settings) ———
export interface ProgramApi {
  id: string;
  name: string;
  description?: string | null;
  trackId?: string | null;
}

export function programsGetAll(): Promise<ProgramApi[]> {
  return apiFetch<ProgramApi[]>("/v1/programs");
}

export function programsCreate(body: { name: string; description?: string | null; trackId?: string | null }): Promise<ProgramApi> {
  return apiFetch<ProgramApi>("/v1/programs", { method: "POST", body });
}

export function programsPatch(id: string, body: Partial<{ name: string; description: string | null; trackId: string | null }>): Promise<ProgramApi> {
  return apiFetch<ProgramApi>(`/v1/programs/${id}`, { method: "PATCH", body });
}

export function programsDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/programs/${id}`, { method: "DELETE" });
}

// ——— Locations (settings) ———
export interface LocationApi {
  id: string;
  name: string;
  address?: string | null;
}

export function locationsGetAll(): Promise<LocationApi[]> {
  return apiFetch<LocationApi[]>("/v1/locations");
}

export function locationsCreate(body: { name: string; address?: string | null }): Promise<LocationApi> {
  return apiFetch<LocationApi>("/v1/locations", { method: "POST", body });
}

export function locationsPatch(id: string, body: Partial<{ name: string; address: string | null }>): Promise<LocationApi> {
  return apiFetch<LocationApi>(`/v1/locations/${id}`, { method: "PATCH", body });
}

export function locationsDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/locations/${id}`, { method: "DELETE" });
}

// ——— Age groups (settings) ———
export interface AgeGroupApi {
  id: string;
  name: string;
  minAge?: number | null;
  maxAge?: number | null;
}

export function ageGroupsGetAll(): Promise<AgeGroupApi[]> {
  return apiFetch<AgeGroupApi[]>("/v1/age-groups");
}

export function ageGroupsCreate(body: { name: string; minAge?: number | null; maxAge?: number | null }): Promise<AgeGroupApi> {
  return apiFetch<AgeGroupApi>("/v1/age-groups", { method: "POST", body });
}

export function ageGroupsPatch(
  id: string,
  body: Partial<{ name: string; minAge: number | null; maxAge: number | null }>
): Promise<AgeGroupApi> {
  return apiFetch<AgeGroupApi>(`/v1/age-groups/${id}`, { method: "PATCH", body });
}

export function ageGroupsDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/age-groups/${id}`, { method: "DELETE" });
}

// ——— Income sources (settings) ———
export interface IncomeSourceApi {
  id: string;
  name: string;
  code?: string | null;
}

export function incomeSourcesGetAll(): Promise<IncomeSourceApi[]> {
  return apiFetch<IncomeSourceApi[]>("/v1/income-sources");
}

export function incomeSourcesCreate(body: { name: string; code?: string | null }): Promise<IncomeSourceApi> {
  return apiFetch<IncomeSourceApi>("/v1/income-sources", { method: "POST", body });
}

export function incomeSourcesPatch(id: string, body: Partial<{ name: string; code: string | null }>): Promise<IncomeSourceApi> {
  return apiFetch<IncomeSourceApi>(`/v1/income-sources/${id}`, { method: "PATCH", body });
}

export function incomeSourcesDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/income-sources/${id}`, { method: "DELETE" });
}

// ——— Expense categories (settings) ———
export interface ExpenseCategoryApi {
  id: string;
  name: string;
  code?: string | null;
}

export function expenseCategoriesGetAll(): Promise<ExpenseCategoryApi[]> {
  return apiFetch<ExpenseCategoryApi[]>("/v1/expense-categories");
}

export function expenseCategoriesCreate(body: { name: string; code?: string | null }): Promise<ExpenseCategoryApi> {
  return apiFetch<ExpenseCategoryApi>("/v1/expense-categories", { method: "POST", body });
}

export function expenseCategoriesPatch(
  id: string,
  body: Partial<{ name: string; code: string | null }>
): Promise<ExpenseCategoryApi> {
  return apiFetch<ExpenseCategoryApi>(`/v1/expense-categories/${id}`, { method: "PATCH", body });
}

export function expenseCategoriesDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/expense-categories/${id}`, { method: "DELETE" });
}

// ——— Focus areas & learning tracks ———
export interface LearningTrackApi {
  id: string;
  name: string;
  slug: string;
  focusAreaId: string;
  level?: string | null;
  order: number;
}

export interface FocusAreaApi {
  id: string;
  name: string;
  slug: string;
  order: number;
  tracks: LearningTrackApi[];
}

export function focusAreasGetAll(): Promise<FocusAreaApi[]> {
  return apiFetch<FocusAreaApi[]>("/v1/focus-areas");
}

// ——— Learners ———
export interface LearnerApi {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  school: string;
  enrolmentType: string;
  programType: string;
  membershipStatus?: string | null;
  userId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  organizationId?: string | null;
  status: string;
  gender?: string | null;
  joinedAt?: string | null;
}

export function learnersGetAll(params?: { search?: string; enrolmentType?: string; organisationId?: string; status?: string }): Promise<LearnerApi[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.enrolmentType) q.set("enrolmentType", params.enrolmentType);
  if (params?.organisationId) q.set("organisationId", params.organisationId);
  if (params?.status) q.set("status", params.status);
  const query = q.toString();
  return apiFetch<LearnerApi[]>(`/v1/learners${query ? `?${query}` : ""}`);
}

export function learnersGetById(id: string): Promise<LearnerApi | null> {
  return apiFetch<LearnerApi>(`/v1/learners/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function learnersCreate(body: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  school: string;
  enrolmentType: string;
  programType: string;
  membershipStatus?: string | null;
  userId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  organizationId?: string | null;
  status?: string;
  gender?: string | null;
  joinedAt?: string | null;
}): Promise<LearnerApi> {
  return apiFetch<LearnerApi>("/v1/learners", { method: "POST", body });
}

export function learnersPatch(
  id: string,
  body: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    school: string;
    enrolmentType: string;
    programType: string;
    membershipStatus: string | null;
    userId: string | null;
    parentName: string | null;
    parentPhone: string | null;
    parentEmail: string | null;
    organizationId: string | null;
    status: string;
    gender: string | null;
    joinedAt: string | null;
  }>
): Promise<LearnerApi> {
  return apiFetch<LearnerApi>(`/v1/learners/${id}`, { method: "PATCH", body });
}

export function learnersDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/learners/${id}`, { method: "DELETE" });
}

// ——— Classes ———
export interface ClassApi {
  id: string;
  name: string;
  program: string;
  ageGroup: string;
  location: string;
  educatorId: string;
  termId: string;
  learnerIds: string[];
  capacity?: number | null;
  schoolOrOrganisationName?: string | null;
  trackId?: string | null;
}

export function classesGetAll(params?: { termId?: string; program?: string; educatorId?: string; trackId?: string }): Promise<ClassApi[]> {
  const q = new URLSearchParams();
  if (params?.termId) q.set("termId", params.termId);
  if (params?.program) q.set("program", params.program);
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  if (params?.trackId) q.set("trackId", params.trackId);
  const query = q.toString();
  return apiFetch<ClassApi[]>(`/v1/classes${query ? `?${query}` : ""}`);
}

export function classesGetById(id: string): Promise<ClassApi | null> {
  return apiFetch<ClassApi>(`/v1/classes/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function classesCreate(body: {
  name: string;
  program: string;
  ageGroup: string;
  location: string;
  educatorId: string;
  termId: string;
  learnerIds?: string[];
  capacity?: number | null;
  schoolOrOrganisationName?: string | null;
}): Promise<ClassApi> {
  return apiFetch<ClassApi>("/v1/classes", {
    method: "POST",
    body,
  });
}

export function classesPatch(
  id: string,
  body: {
    name?: string;
    program?: string;
    ageGroup?: string;
    location?: string;
    educatorId?: string | null;
    termId?: string;
    learnerIds?: string[];
    capacity?: number | null;
    schoolOrOrganisationName?: string | null;
    trackId?: string | null;
  }
): Promise<ClassApi> {
  return apiFetch<ClassApi>(`/v1/classes/${id}`, {
    method: "PATCH",
    body,
  });
}

export function classesDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/classes/${id}`, { method: "DELETE" });
}

// ——— Sessions ———
export interface SessionApi {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  sessionType: string;
  durationHours: number;
  learningTrack: string;
  termId: string;
  leadEducatorId: string;
  assistantEducatorIds: string[];
}

export function sessionsGetAll(params?: { termId?: string; classId?: string; educatorId?: string; dateFrom?: string; dateTo?: string }): Promise<SessionApi[]> {
  const q = new URLSearchParams();
  if (params?.termId) q.set("termId", params.termId);
  if (params?.classId) q.set("classId", params.classId);
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params?.dateTo) q.set("dateTo", params.dateTo);
  const query = q.toString();
  return apiFetch<SessionApi[]>(`/v1/sessions${query ? `?${query}` : ""}`);
}

export function sessionsGetById(id: string): Promise<SessionApi | null> {
  return apiFetch<SessionApi>(`/v1/sessions/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

// ——— Attendance ———
export interface AttendanceRecordApi {
  id: string;
  sessionId: string;
  learnerId: string;
  status: string;
  stars?: number | null;
  notes?: string | null;
  markedAt?: string | null;
  markedBy?: string | null;
}

export function attendanceGet(sessionId: string): Promise<AttendanceRecordApi[]> {
  return apiFetch<AttendanceRecordApi[]>(`/v1/sessions/${sessionId}/attendance`);
}

export function attendancePut(
  sessionId: string,
  body: Array<{ learnerId: string; status?: string; stars?: number; notes?: string }>
): Promise<AttendanceRecordApi[]> {
  return apiFetch<AttendanceRecordApi[]>(`/v1/sessions/${sessionId}/attendance`, { method: "PUT", body });
}

// ——— Educators ———
export interface EducatorApi {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string | null;
  organizationId: string | null;
  membershipStatus: string | null;
  avatarId: string | null;
  createdAt: string;
}

export function educatorsGetAll(params?: { role?: string; status?: string }): Promise<EducatorApi[]> {
  const q = new URLSearchParams();
  if (params?.role) q.set("role", params.role);
  if (params?.status) q.set("status", params.status);
  const query = q.toString();
  return apiFetch<EducatorApi[]>(`/v1/educators${query ? `?${query}` : ""}`);
}

export function educatorsGetById(id: string): Promise<EducatorApi | null> {
  return apiFetch<EducatorApi>(`/v1/educators/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

// ——— Session reports ———
export interface SessionReportApi {
  id: string;
  sessionId: string;
  status: string;
  leadEducatorId: string;
  assistantEducatorIds: string[];
  date: string;
  duration: string;
  sessionType: string;
  schoolOrOrganizationName: string;
  totalLearners: number;
  learningTrack: string;
  durationHours: number;
  femaleCount: number;
  maleCount: number;
  highlights: string[];
  objectivesMet: string;
  createdAt?: string;
  updatedAt?: string;
}

export function sessionReportsGetAll(params?: { dateFrom?: string; dateTo?: string; educatorId?: string }): Promise<SessionReportApi[]> {
  const q = new URLSearchParams();
  if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params?.dateTo) q.set("dateTo", params.dateTo);
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  const query = q.toString();
  return apiFetch<SessionReportApi[]>(`/v1/session-reports${query ? `?${query}` : ""}`);
}

export function sessionReportsGetBySession(sessionId: string): Promise<SessionReportApi | null> {
  return apiFetch<SessionReportApi>(`/v1/session-reports/by-session/${sessionId}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function sessionReportsGetById(id: string): Promise<SessionReportApi | null> {
  return apiFetch<SessionReportApi>(`/v1/session-reports/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function sessionReportsCreate(body: Partial<SessionReportApi> & { sessionId: string; leadEducatorId: string; date: string }): Promise<SessionReportApi> {
  return apiFetch<SessionReportApi>("/v1/session-reports", { method: "POST", body });
}

export function sessionReportsPatch(id: string, body: Partial<SessionReportApi>): Promise<SessionReportApi> {
  return apiFetch<SessionReportApi>(`/v1/session-reports/${id}`, { method: "PATCH", body });
}

// ——— Educator & learner badges ———

export interface EducatorBadgeApi {
  id: string;
  educatorId: string;
  badgeId: string;
  trackId?: string | null;
  earnedAt: string;
}

export function educatorBadgesGetAll(educatorId: string): Promise<EducatorBadgeApi[]> {
  return apiFetch<EducatorBadgeApi[]>(`/v1/educators/${educatorId}/badges`);
}

export function educatorBadgesCreate(
  educatorId: string,
  body: { badgeId: string; trackId?: string | null; earnedAt?: string }
): Promise<EducatorBadgeApi> {
  return apiFetch<EducatorBadgeApi>(`/v1/educators/${educatorId}/badges`, {
    method: "POST",
    body,
  });
}

export interface LearnerBadgeAwardApi {
  id: string;
  learnerId: string;
  sessionId: string;
  badgeId: string;
  awardedAt: string;
  awardedBy: string;
}

export function learnerBadgesGetAll(learnerId: string): Promise<LearnerBadgeAwardApi[]> {
  return apiFetch<LearnerBadgeAwardApi[]>(`/v1/learners/${learnerId}/badges`);
}

export function learnerBadgesCreate(
  learnerId: string,
  body: { sessionId: string; badgeId: string; awardedAt?: string; awardedBy?: string }
): Promise<LearnerBadgeAwardApi> {
  return apiFetch<LearnerBadgeAwardApi>(`/v1/learners/${learnerId}/badges`, {
    method: "POST",
    body,
  });
}

// ——— Organisations (signup is public; creates pending request until admin approves) ———
export interface OrganisationSignupPayload {
  signupType: "school" | "organisation" | "miradi";
  organisationName: string;
  type: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string | null;
  location?: string | null;
  password: string;
}

export interface OrganisationSignupResponse {
  id: string;
  message: string;
  accountCreated?: boolean;
}

// ——— Partners (organisations, parents, learners) ———

export interface OrganisationPartnerApi {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
  contactEmail: string | null;
  contactPhone: string | null;
  location: string;
  status: string;
  createdAt: string;
}

export interface ParentPartnerApi {
  id: string;
  name: string;
  email: string | null;
  contactPhone: string | null;
  status: string;
  createdAt: string;
}

export interface LearnerPartnerApi {
  id: string;
  firstName: string;
  lastName: string;
  school: string;
  programType: string;
  enrollmentType: string;
  organizationId: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  status: string;
}

export function partnersGetOrganisations(): Promise<OrganisationPartnerApi[]> {
  return apiFetch<OrganisationPartnerApi[]>("/v1/partners/organisations");
}

export function partnersGetParents(): Promise<ParentPartnerApi[]> {
  return apiFetch<ParentPartnerApi[]>("/v1/partners/parents");
}

export function partnersGetLearners(): Promise<LearnerPartnerApi[]> {
  return apiFetch<LearnerPartnerApi[]>("/v1/partners/learners");
}

// ——— Admin: pending signups (school, org, miradi, parent) ———
export interface PendingSignupApi {
  id: string;
  signupType: string;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export function adminPendingSignupsGet(): Promise<PendingSignupApi[]> {
  return apiFetch<PendingSignupApi[]>("/v1/admin/pending-signups");
}

export function adminPendingSignupApprove(id: string): Promise<{ approved: boolean; type: string; message: string }> {
  return apiFetch<{ approved: boolean; type: string; message: string }>(`/v1/admin/pending-signups/${id}/approve`, {
    method: "POST",
  });
}

export function adminPendingSignupReject(id: string): Promise<{ rejected: boolean; message: string }> {
  return apiFetch<{ rejected: boolean; message: string }>(`/v1/admin/pending-signups/${id}/reject`, {
    method: "POST",
  });
}

// ——— Admin: dashboard overview (real data) ———
export interface AdminOverviewApi {
  partners: { organisationId: string; organisationName: string; type: "SCHOOL" | "ORGANISATION" | "MIRADI"; activeLearners: number }[];
  activeSchools: number;
  activeOrganisations: number;
  activeMiradis: number;
  learnersByTrack: { learningTrackId: string; learningTrackName: string; learnerCount: number }[];
  peopleStats: { activeLearners: number; activeEducators: number; activeParents: number; pendingAccounts: number };
  financeStats: { totalInvoiced: number; totalCollected: number; totalPending: number; learnersWithPendingPayments: number };
  sessionReportsMissingCount: number;
  learnersWithPending: {
    learnerId: string;
    learnerName: string;
    enrolmentType: string;
    payerLabel: string;
    payerPhone: string;
    payerEmail: string;
    totalInvoiced: number;
    totalPaid: number;
    pendingAmount: number;
    isOverdue: boolean;
  }[];
  organizationsWithPending: {
    organizationId: string;
    organizationName: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    pendingAmount: number;
    isOverdue: boolean;
  }[];
  pendingUsers: { id: string; name: string; email: string | null; role: string; createdAt: string }[];
}

export function adminOverviewGet(): Promise<AdminOverviewApi> {
  return apiFetch<AdminOverviewApi>("/v1/admin/overview");
}

export interface OrganisationApi {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
  contactEmail: string | null;
  contactPhone: string | null;
  location: string;
}

export function organisationsGetById(id: string): Promise<OrganisationApi | null> {
  return apiFetch<OrganisationApi>(`/v1/organisations/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

/** GET /v1/organisations/:id/learners – learners scoped to this organisation. */
export function organisationsGetLearners(id: string): Promise<LearnerApi[]> {
  return apiFetch<LearnerApi[]>(`/v1/organisations/${id}/learners`);
}

/** GET /v1/organisations/:id/invoices – invoices for this organisation. */
export function organisationsGetInvoices(id: string): Promise<FinanceInvoiceApi[]> {
  return apiFetch<FinanceInvoiceApi[]>(`/v1/organisations/${id}/invoices`);
}

export type OrganisationUpdateBody = {
  name?: string;
  type?: string;
  contactPerson?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  location?: string;
};

export function organisationsUpdate(id: string, body: OrganisationUpdateBody): Promise<OrganisationApi> {
  return apiFetch<OrganisationApi>(`/v1/organisations/${id}`, { method: "PATCH", body });
}

export function organisationsDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/organisations/${id}`, { method: "DELETE" });
}

export function organisationsSignup(payload: OrganisationSignupPayload): Promise<OrganisationSignupResponse> {
  return apiFetch<OrganisationSignupResponse>("/v1/organisations/signup", {
    method: "POST",
    body: payload,
    token: null,
  });
}

// ——— Admin: account approvals (admin only) ———
export interface AdminAccountUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string | null;
  organizationId: string | null;
  membershipStatus: string | null;
  avatarId: string | null;
  createdAt: string;
}

export function adminAccountsGetPending(): Promise<AdminAccountUser[]> {
  return apiFetch<AdminAccountUser[]>("/v1/admin/accounts?status=pending");
}

export function adminAccountsPatch(
  id: string,
  body: { name?: string; email?: string; status?: string; role?: string; organizationId?: string | null }
): Promise<AdminAccountUser> {
  return apiFetch<AdminAccountUser>(`/v1/admin/accounts/${id}`, { method: "PATCH", body });
}

export function adminAccountsCreate(body: {
  name: string;
  email: string;
  role: string;
  password: string;
  organizationId?: string | null;
}): Promise<AdminAccountUser> {
  return apiFetch<AdminAccountUser>("/v1/admin/accounts", { method: "POST", body });
}

export interface AdminCreateOrganisationBody {
  organisationName: string;
  type: "school" | "organisation" | "miradi" | "other";
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string | null;
  location?: string | null;
  password: string;
}

export function adminCreateOrganisationAccount(body: AdminCreateOrganisationBody): Promise<{
  user: AdminAccountUser;
  organisationId: string;
}> {
  return apiFetch<{ user: AdminAccountUser; organisationId: string }>(
    "/v1/admin/accounts/organisation",
    { method: "POST", body }
  );
}

export function adminAccountsDelete(id: string): Promise<void> {
  return apiFetch<void>(`/v1/admin/accounts/${id}`, { method: "DELETE" });
}

// ——— Parent self-signup (public) ———
export function parentsSignup(payload: {
  name: string;
  email: string;
  password: string;
  contactPhone?: string | null;
}): Promise<{ id: string; message: string }> {
  return apiFetch<{ id: string; message: string }>("/v1/parents/signup", {
    method: "POST",
    body: payload,
    token: null,
  });
}

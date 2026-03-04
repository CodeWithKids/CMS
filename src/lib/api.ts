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
}

export function classesGetAll(params?: { termId?: string; program?: string; educatorId?: string }): Promise<ClassApi[]> {
  const q = new URLSearchParams();
  if (params?.termId) q.set("termId", params.termId);
  if (params?.program) q.set("program", params.program);
  if (params?.educatorId) q.set("educatorId", params.educatorId);
  const query = q.toString();
  return apiFetch<ClassApi[]>(`/v1/classes${query ? `?${query}` : ""}`);
}

export function classesGetById(id: string): Promise<ClassApi | null> {
  return apiFetch<ClassApi>(`/v1/classes/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export function classesPatch(
  id: string,
  body: {
    educatorId?: string | null;
  }
): Promise<ClassApi> {
  return apiFetch<ClassApi>(`/v1/classes/${id}`, {
    method: "PATCH",
    body,
  });
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
  body: { status?: string; role?: string; organizationId?: string | null }
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

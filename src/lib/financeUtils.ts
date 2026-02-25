import type { AppUser, Invoice, Learner, Organization, IncomeEntry, IncomeSessionType, IncomePayerType } from "@/types";
import { getIncomeSessionTypeFromSource, getIncomePayerTypeFromSource } from "@/types";

/** Currency: Kenyan Shillings (KES / Ksh) */
export const CURRENCY_CODE = "KES";
export const CURRENCY_LABEL = "Ksh";

/** Format amount as Kenyan Shillings (e.g. "Ksh 1,500" or "KES 1,500" via Intl) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Amount considered "paid" for an invoice (full amount if paid, paidAmount if partially_paid, else 0) */
export function getPaidAmount(inv: Invoice): number {
  if (inv.status === "paid") return inv.totalAmount;
  if (inv.status === "partially_paid") return inv.paidAmount ?? 0;
  return 0;
}

/** Effective session type for reporting (stored on invoice or derived from source). */
export function getEffectiveSessionType(inv: Invoice): IncomeSessionType {
  return inv.sessionType ?? getIncomeSessionTypeFromSource(inv.source);
}

/** Effective payer type for reporting (stored on invoice or derived from source). */
export function getEffectivePayerType(inv: Invoice): IncomePayerType {
  return inv.payerType ?? getIncomePayerTypeFromSource(inv.source);
}

/**
 * Build income entries from invoices for reporting. One entry per invoice with received amount
 * (paid or partially_paid). Use for filtering/grouping by sessionType, organisationId, payerType.
 */
export function invoicesToIncomeEntries(invoices: Invoice[]): IncomeEntry[] {
  const entries: IncomeEntry[] = [];
  for (const inv of invoices) {
    const amount = getPaidAmount(inv);
    if (amount <= 0) continue;
    const date = inv.paidDate ?? inv.dueDate;
    entries.push({
      id: `income-${inv.id}`,
      amount,
      date,
      description: inv.description ?? undefined,
      sessionType: getEffectiveSessionType(inv),
      organisationId: inv.organizationId ?? undefined,
      payerType: getEffectivePayerType(inv),
      invoiceId: inv.id,
    });
  }
  return entries;
}

export interface RevenueByEnrolmentType {
  member: number;
  partner_org: number;
}

/** Collected revenue (paid amounts) broken down by learner vs org. Org-level invoices (school_club, organisation) count as partner_org. */
export function getRevenueByEnrolmentType(
  invoices: Invoice[],
  learners: Learner[]
): RevenueByEnrolmentType {
  const learnerMap = new Map(learners.map((l) => [l.id, l]));
  let member = 0;
  let partner_org = 0;
  for (const inv of invoices) {
    const paid = getPaidAmount(inv);
    if (paid <= 0) continue;
    if (inv.organizationId != null) {
      partner_org += paid; // school/org billed as one client
    } else if (inv.learnerId != null) {
      const learner = learnerMap.get(inv.learnerId);
      if (learner?.enrolmentType === "partner_org") partner_org += paid;
      else member += paid;
    }
  }
  return { member, partner_org };
}

/** Pending amount for a single invoice */
export function getInvoicePendingAmount(inv: Invoice): number {
  return inv.totalAmount - getPaidAmount(inv);
}

/** Whether an invoice is overdue (unpaid or partially paid and past dueDate) */
export function isInvoiceOverdue(inv: Invoice): boolean {
  if (inv.status === "paid" || inv.status === "draft") return false;
  const pending = getInvoicePendingAmount(inv);
  if (pending <= 0) return false;
  if (!inv.dueDate) return false;
  return new Date(inv.dueDate) < new Date();
}

export interface PeopleStats {
  activeLearners: number;
  activeEducators: number;
  activeParents: number;
  pendingAccounts: number;
}

export function getPeopleStats(users: AppUser[], learners: Learner[]): PeopleStats {
  const activeUsers = users.filter((u) => (u.status ?? "active") === "active");
  return {
    activeLearners: learners.filter((l) => l.status === "active").length,
    activeEducators: activeUsers.filter((u) => u.role === "educator").length,
    activeParents: activeUsers.filter((u) => u.role === "parent").length,
    pendingAccounts: users.filter((u) => u.status === "pending").length,
  };
}

export interface FinanceStats {
  totalInvoiced: number;
  totalCollected: number;
  totalPending: number;
  learnersWithPendingPayments: number;
}

export function getFinanceStats(invoices: Invoice[], learners: Learner[]): FinanceStats {
  let totalInvoiced = 0;
  let totalCollected = 0;
  for (const inv of invoices) {
    totalInvoiced += inv.totalAmount;
    totalCollected += getPaidAmount(inv);
  }
  const totalPending = totalInvoiced - totalCollected;
  const learnerIdsWithPending = new Set<string>();
  for (const inv of invoices) {
    if (inv.learnerId != null && getInvoicePendingAmount(inv) > 0) learnerIdsWithPending.add(inv.learnerId);
  }
  return {
    totalInvoiced,
    totalCollected,
    totalPending,
    learnersWithPendingPayments: learnerIdsWithPending.size,
  };
}

export interface LearnerPaymentSummary {
  learnerId: string;
  learnerName: string;
  /** "member" = parent pays; "partner_org" = organisation pays */
  enrolmentType: Learner["enrolmentType"];
  /** For member: parent name; for partner_org: organisation name */
  payerLabel: string;
  payerPhone: string;
  payerEmail: string;
  totalInvoiced: number;
  totalPaid: number;
  pendingAmount: number;
  isOverdue: boolean;
}

export function getLearnersWithPendingPayments(
  learners: Learner[],
  invoices: Invoice[],
  getOrganization?: (id: string) => Organization | undefined
): LearnerPaymentSummary[] {
  const byLearner = new Map<
    string,
    { totalInvoiced: number; totalPaid: number; pendingAmount: number; hasOverdue: boolean }
  >();
  for (const inv of invoices) {
    if (inv.learnerId == null) continue; // org-level invoices are not per-learner
    const paid = getPaidAmount(inv);
    const pending = inv.totalAmount - paid;
    const existing = byLearner.get(inv.learnerId);
    const hasOverdue = existing?.hasOverdue ?? false ? true : isInvoiceOverdue(inv);
    byLearner.set(inv.learnerId, {
      totalInvoiced: (existing?.totalInvoiced ?? 0) + inv.totalAmount,
      totalPaid: (existing?.totalPaid ?? 0) + paid,
      pendingAmount: (existing?.pendingAmount ?? 0) + pending,
      hasOverdue: existing?.hasOverdue ?? hasOverdue,
    });
  }
  const result: LearnerPaymentSummary[] = [];
  for (const learner of learners) {
    const summary = byLearner.get(learner.id);
    if (!summary || summary.pendingAmount <= 0) continue;
    const isPartner = learner.enrolmentType === "partner_org";
    const org = isPartner && learner.organizationId && getOrganization
      ? getOrganization(learner.organizationId)
      : undefined;
    result.push({
      learnerId: learner.id,
      learnerName: `${learner.firstName} ${learner.lastName}`,
      enrolmentType: learner.enrolmentType,
      payerLabel: isPartner && org ? org.name : (learner.parentName ?? "—"),
      payerPhone: isPartner && org ? (org.contactPhone ?? "") : (learner.parentPhone ?? ""),
      payerEmail: isPartner && org ? (org.contactEmail ?? "") : (learner.parentEmail ?? ""),
      totalInvoiced: summary.totalInvoiced,
      totalPaid: summary.totalPaid,
      pendingAmount: summary.pendingAmount,
      isOverdue: summary.hasOverdue,
    });
  }
  return result;
}

export interface OrganizationPaymentSummary {
  organizationId: string;
  organizationName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  totalInvoiced: number;
  totalPaid: number;
  pendingAmount: number;
  isOverdue: boolean;
  learnerIds: string[];
}

/** Aggregate pending payments by organisation. Includes org-level invoices (school_club/organisation) and legacy per-learner org invoices. */
export function getOrganizationsWithPendingPayments(
  learners: Learner[],
  invoices: Invoice[],
  getOrganization: (id: string) => Organization | undefined
): OrganizationPaymentSummary[] {
  const learnerMap = new Map(learners.map((l) => [l.id, l]));
  const byOrg = new Map<
    string,
    { totalInvoiced: number; totalPaid: number; pendingAmount: number; hasOverdue: boolean; learnerIds: Set<string> }
  >();
  for (const inv of invoices) {
    const orgId = inv.organizationId ?? (inv.learnerId != null ? learnerMap.get(inv.learnerId)?.organizationId : undefined);
    if (!orgId) continue;
    const paid = getPaidAmount(inv);
    const pending = inv.totalAmount - paid;
    const existing = byOrg.get(orgId);
    const hasOverdue = existing?.hasOverdue ?? false ? true : isInvoiceOverdue(inv);
    const learnerIds = existing?.learnerIds ?? new Set<string>();
    if (inv.learnerId != null) learnerIds.add(inv.learnerId);
    byOrg.set(orgId, {
      totalInvoiced: (existing?.totalInvoiced ?? 0) + inv.totalAmount,
      totalPaid: (existing?.totalPaid ?? 0) + paid,
      pendingAmount: (existing?.pendingAmount ?? 0) + pending,
      hasOverdue: existing?.hasOverdue ?? hasOverdue,
      learnerIds,
    });
  }
  const result: OrganizationPaymentSummary[] = [];
  for (const [orgId, summary] of byOrg) {
    if (summary.pendingAmount <= 0) continue;
    const org = getOrganization(orgId);
    if (!org) continue;
    result.push({
      organizationId: org.id,
      organizationName: org.name,
      contactPerson: org.contactPerson,
      contactPhone: org.contactPhone ?? "",
      contactEmail: org.contactEmail ?? "",
      totalInvoiced: summary.totalInvoiced,
      totalPaid: summary.totalPaid,
      pendingAmount: summary.pendingAmount,
      isOverdue: summary.hasOverdue,
      learnerIds: Array.from(summary.learnerIds),
    });
  }
  return result;
}

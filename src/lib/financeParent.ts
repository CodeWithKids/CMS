import type { Invoice } from "@/types";

/** Per-learner invoices visible to a parent (learnerId must be in the allowed child set). */
export function filterInvoicesForParentLearners(invoices: Invoice[], learnerIds: string[]): Invoice[] {
  if (learnerIds.length === 0) return [];
  const allowed = new Set(learnerIds);
  return invoices.filter((inv) => inv.learnerId != null && allowed.has(inv.learnerId));
}

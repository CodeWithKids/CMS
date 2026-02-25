/**
 * Finance flow types – CWK Hub.
 * Invoice, Payment, Adjustments (discounts/refunds), Credit notes, policy.
 */

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type PayerType = "parent" | "organisation";

export interface FinanceInvoice {
  id: string;
  payerType: PayerType;
  payerId: string;
  learnerId?: string;
  organisationId?: string;
  termId: string;
  programmeId?: string;
  trackId?: string;

  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;

  dueDate: string;
  issueDate: string;
  status: InvoiceStatus;

  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type PaymentMethod =
  | "mpesa"
  | "bank_transfer"
  | "cash"
  | "card"
  | "other";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  date: string;
  recordedBy: string;
  createdAt: string;
}

export type AdjustmentType = "discount" | "refund";

export type DiscountScope = "this_invoice" | "this_term" | "ongoing";

export type RefundApplication = "refund_to_payer" | "credit_for_future";

export type AdjustmentStatus = "draft" | "pending" | "approved" | "rejected";

export interface AdjustmentRequest {
  id: string;
  type: AdjustmentType;
  invoiceId: string;

  discountScope?: DiscountScope;
  discountPercent?: number;
  discountAmount?: number;

  refundAmount?: number;
  refundApplication?: RefundApplication;

  reason: string;

  status: AdjustmentStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  decisionNote?: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  amount: number;
  reason: string;

  appliedAs: RefundApplication;
  status: "created" | "refunded" | "applied_to_future";

  requestedBy: string;
  requestedAt: string;
  approvedBy: string;
  approvedAt: string;

  refundExecutedAt?: string;
}

export interface FinancePolicy {
  maxDiscountWithoutApprovalPercent: number;
  allowRefundAfterWeekNumber: number;
  defaultRefundMode: RefundApplication;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const PAYER_TYPE_LABELS: Record<PayerType, string> = {
  parent: "Parent",
  organisation: "Organisation",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

export const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  discount: "Discount",
  refund: "Refund",
};

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const DISCOUNT_SCOPE_LABELS: Record<DiscountScope, string> = {
  this_invoice: "This invoice",
  this_term: "This term",
  ongoing: "Ongoing",
};

export const REFUND_APPLICATION_LABELS: Record<RefundApplication, string> = {
  refund_to_payer: "Refund to payer",
  credit_for_future: "Credit for future invoices",
};

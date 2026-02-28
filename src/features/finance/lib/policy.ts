import type { FinancePolicy } from "@/types/finance";

export const DEFAULT_FINANCE_POLICY: FinancePolicy = {
  maxDiscountWithoutApprovalPercent: 5,
  allowRefundAfterWeekNumber: 4,
  defaultRefundMode: "credit_for_future",
};

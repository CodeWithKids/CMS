import type { AppUser } from "@/types";

export function canViewFinanceDashboard(user: AppUser | null): boolean {
  return user?.role === "admin" || user?.role === "finance";
}

export function canCreateInvoice(user: AppUser | null): boolean {
  return user?.role === "admin" || user?.role === "finance";
}

export function canRecordPayment(user: AppUser | null): boolean {
  return user?.role === "admin" || user?.role === "finance";
}

export function canRequestAdjustment(user: AppUser | null): boolean {
  return user?.role === "admin" || user?.role === "finance";
}

export function canApproveAdjustment(user: AppUser | null): boolean {
  return user?.role === "admin" || user?.role === "finance";
}

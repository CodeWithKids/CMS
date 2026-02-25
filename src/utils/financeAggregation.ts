import type { Invoice, Expense } from "@/types";

export interface MonthlyFinanceSummary {
  month: number; // 1–12
  income: number;
  expenses: number;
  net: number; // income - expenses
}

/**
 * Returns monthly income/expenses/net for the given year (12 entries, month 1..12).
 * Income: only paid/partially_paid invoices; month from paidDate or dueDate.
 * Expenses: month from expense.date; sum amount for that year.
 */
export function getMonthlyFinanceSummaryForYear(
  year: number,
  invoices: Invoice[],
  expenses: Expense[]
): MonthlyFinanceSummary[] {
  const result: MonthlyFinanceSummary[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expenses: 0,
    net: 0,
  }));

  for (const inv of invoices) {
    if (inv.status !== "paid" && inv.status !== "partially_paid") continue;
    const dateStr = inv.paidDate ?? inv.dueDate;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
    const month = d.getMonth() + 1;
    const amount = inv.paidAmount != null ? inv.paidAmount : inv.status === "paid" ? inv.totalAmount : Math.round(inv.totalAmount * 0.5);
    result[month - 1].income += amount;
  }

  for (const ex of expenses) {
    const d = new Date(ex.date);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
    const month = d.getMonth() + 1;
    result[month - 1].expenses += ex.amount;
  }

  for (const row of result) {
    row.net = row.income - row.expenses;
  }

  return result;
}

export function getYearTotals(summary: MonthlyFinanceSummary[]): {
  totalIncome: number;
  totalExpenses: number;
  totalNet: number;
} {
  return summary.reduce(
    (acc, row) => ({
      totalIncome: acc.totalIncome + row.income,
      totalExpenses: acc.totalExpenses + row.expenses,
      totalNet: acc.totalNet + row.net,
    }),
    { totalIncome: 0, totalExpenses: 0, totalNet: 0 }
  );
}

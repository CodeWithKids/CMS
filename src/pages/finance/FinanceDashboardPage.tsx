import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPaidAmount, getLearnersWithPendingPayments, getRevenueByEnrolmentType, formatCurrency } from "@/lib/financeUtils";
import { mockInvoices, mockLearners, mockEducatorPayments, mockExpenses, getOrganization } from "@/mockData";
import { INVOICE_SOURCE_LABELS, getInvoicePayerType, INVOICE_PAYER_LABELS } from "@/types";
import type { InvoiceSource } from "@/types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// "This term" = all mock data (or filter by term dates if needed)
const TERM_START = "2025-01-01";
const TERM_END = "2025-03-31";

function inTermRange(dateStr: string): boolean {
  return dateStr >= TERM_START && dateStr <= TERM_END;
}

export default function FinanceDashboardPage() {
  const totalIncomeThisTerm = useMemo(() => {
    return mockInvoices
      .filter((inv) => inTermRange(inv.dueDate) && (inv.status === "paid" || inv.status === "partially_paid"))
      .reduce((sum, inv) => sum + getPaidAmount(inv), 0);
  }, []);

  const totalExpensesThisTerm = useMemo(() => {
    return mockExpenses
      .filter((ex) => inTermRange(ex.date))
      .reduce((sum, ex) => sum + ex.amount, 0);
  }, []);

  const netResult = totalIncomeThisTerm - totalExpensesThisTerm;

  const totalEducatorPaymentsThisTerm = useMemo(() => {
    return mockEducatorPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
  }, []);

  const incomeBySource = useMemo(() => {
    const map = new Map<InvoiceSource, number>();
    for (const inv of mockInvoices) {
      if (inv.status !== "paid" && inv.status !== "partially_paid") continue;
      const paid = getPaidAmount(inv);
      if (paid <= 0) continue;
      map.set(inv.source, (map.get(inv.source) ?? 0) + paid);
    }
    return Array.from(map.entries())
      .map(([source, total]) => ({ source, total }))
      .sort((a, b) => b.total - a.total);
  }, []);

  const revenueByEnrolmentType = useMemo(
    () => getRevenueByEnrolmentType(mockInvoices, mockLearners),
    []
  );

  const topPendingLearners = useMemo(() => {
    const list = getLearnersWithPendingPayments(mockLearners, mockInvoices, getOrganization);
    return list.sort((a, b) => b.pendingAmount - a.pendingAmount).slice(0, 5);
  }, []);

  const recentExpenses = useMemo(() => {
    return [...mockExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance dashboard</h1>
        <p className="text-muted-foreground">
          Income, expenses, educator payments, and quick lists for this term.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total income (this term)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalIncomeThisTerm)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total expenses (this term)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalExpensesThisTerm)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netResult >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(netResult)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Educator payments (paid, this term)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalEducatorPaymentsThisTerm)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by payer type (member vs partner org) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Member revenue (collected)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(revenueByEnrolmentType.member)}</p>
            <p className="text-xs text-muted-foreground mt-1">From learners with direct parent billing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partner org revenue (collected)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(revenueByEnrolmentType.partner_org)}</p>
            <p className="text-xs text-muted-foreground mt-1">From school/org partner invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Income breakdown by source */}
      <Card>
        <CardHeader>
          <CardTitle>Income by source</CardTitle>
          <CardDescription>
            Totals from paid and partially paid invoices. School STEM Club and Organisation: invoice sent to school/org; they pay directly (not the learner).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeBySource.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-sm">
                    No income recorded.
                  </TableCell>
                </TableRow>
              ) : (
                incomeBySource.map(({ source, total }) => (
                  <TableRow key={source}>
                    <TableCell className="font-medium">{INVOICE_SOURCE_LABELS[source]}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {INVOICE_PAYER_LABELS[getInvoicePayerType(source)]}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 learners with pending balances */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 learners with highest pending balances</CardTitle>
            <CardDescription>Outstanding invoice amounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPendingLearners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-sm">
                      No pending balances.
                    </TableCell>
                  </TableRow>
                ) : (
                  topPendingLearners.map((row) => (
                    <TableRow key={row.learnerId}>
                      <TableCell className="font-medium">{row.learnerName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.pendingAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
            <CardDescription>Last 5 expenses by date.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExpenses.map((ex) => (
                  <TableRow key={ex.id}>
                    <TableCell className="text-sm">{formatDate(ex.date)}</TableCell>
                    <TableCell className="text-sm">{ex.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ex.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

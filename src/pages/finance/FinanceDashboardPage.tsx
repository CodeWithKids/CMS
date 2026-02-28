import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useInvoices, usePendingAdjustments } from "@/context/FinanceContext";
import { mockTerms } from "@/mockData";
import { formatCurrency } from "@/lib/financeUtils";
import { INVOICE_STATUS_LABELS } from "@/types/finance";
import type { FinanceInvoice } from "@/types/finance";
import { LayoutDashboard, FileText, AlertCircle, Users, Package, TrendingUp, Receipt, Banknote } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

function inTermRange(termId: string, start: string, end: string): (inv: FinanceInvoice) => boolean {
  return (inv) => inv.termId === termId && inv.dueDate >= start && inv.dueDate <= end;
}

export default function FinanceDashboardPage() {
  const [termId, setTermId] = useState("t1");
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const term = useMemo(() => mockTerms.find((t) => t.id === termId), [termId]);
  const allInvoices = useInvoices({ termId });
  const pendingAdjustments = usePendingAdjustments();

  const kpis = useMemo(() => {
    const list = allInvoices;
    const totalGross = list.reduce((s, i) => s + i.grossAmount, 0);
    const totalDiscounts = list.reduce((s, i) => s + i.discountAmount, 0);
    const netInvoiced = list.reduce((s, i) => s + i.netAmount, 0);
    const amountPaid = list.reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = list.reduce((s, i) => s + Math.max(0, i.balance), 0);
    const overdue = list.filter((i) => i.dueDate < today && i.balance > 0).reduce((s, i) => s + i.balance, 0);
    return {
      totalGross,
      totalDiscounts,
      netInvoiced,
      amountPaid,
      outstanding,
      overdue,
    };
  }, [allInvoices]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of allInvoices) {
      const status = inv.status;
      map.set(status, (map.get(status) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [allInvoices]);

  const overdueCount = useMemo(
    () => allInvoices.filter((i) => i.dueDate < today && i.balance > 0).length,
    [allInvoices]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance dashboard</h1>
          <p className="text-muted-foreground">
            Key metrics, invoices, and quick links for the selected term.
          </p>
        </div>
        <Select value={termId} onValueChange={setTermId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            {mockTerms.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load the dashboard.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setLoadError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total gross invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalGross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total discounts given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalDiscounts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpis.netInvoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amount paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(kpis.amountPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding (incl. overdue)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpis.outstanding)}</p>
            {kpis.overdue > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(kpis.overdue)} overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices by status */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices by status</CardTitle>
          <CardDescription>
            Count of invoices in this term by status (issued, paid, overdue, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices for this term.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {byStatus.map(({ status, count }) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
                >
                  <span className="font-medium">{INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS] ?? status}</span>
                  <span className="text-muted-foreground">{count}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finance home — single place for all finance operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" /> Finance home
          </CardTitle>
          <CardDescription>
            Invoices, educator payments, session expenses, organisational expenses, and inventory. One place for all finance operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/finance/invoices"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Invoices</p>
                <p className="text-xs text-muted-foreground">{allInvoices.length} in this term</p>
              </div>
            </Link>
            <Link
              to="/finance/invoices?status=overdue"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="font-medium">Overdue invoices</p>
                <p className="text-xs text-muted-foreground">{overdueCount} overdue</p>
              </div>
            </Link>
            <Link
              to="/finance/adjustments"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Pending adjustments</p>
                <p className="text-xs text-muted-foreground">
                  {pendingAdjustments.length} discount/refund requests
                </p>
              </div>
            </Link>
            <Link
              to="/finance/educators"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Educator earnings & hours</p>
                <p className="text-xs text-muted-foreground">Payments and session data</p>
              </div>
            </Link>
            <Link
              to="/finance/session-expenses"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Receipt className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Session expenses</p>
                <p className="text-xs text-muted-foreground">Educator transport & costs</p>
              </div>
            </Link>
            <Link
              to="/finance/expenses"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Banknote className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Organisation expenses</p>
                <p className="text-xs text-muted-foreground">Rent, equipment, etc.</p>
              </div>
            </Link>
            <Link
              to="/finance/inventory"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Package className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Inventory</p>
                <p className="text-xs text-muted-foreground">Devices and kits</p>
              </div>
            </Link>
            <Link
              to="/finance/reports"
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Reports</p>
                <p className="text-xs text-muted-foreground">Income and analytics</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

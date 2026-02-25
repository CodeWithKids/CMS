import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPaymentsForEducator } from "@/mockData";
import { formatCurrency } from "@/lib/financeUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Banknote, Clock, CheckCircle } from "lucide-react";
import type { EducatorPaymentStatus, EducatorPaymentType } from "@/types";

const STATUS_LABELS: Record<EducatorPaymentStatus, string> = {
  planned: "Planned",
  pending: "Pending",
  paid: "Paid",
};

const TYPE_LABELS: Record<EducatorPaymentType, string> = {
  stipend: "Stipend",
  salary: "Salary",
  bonus: "Bonus",
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function EducatorEarningsPage() {
  const { currentUser } = useAuth();

  const payments = useMemo(() => {
    if (!currentUser?.id) return [];
    if (currentUser.role !== "educator") return [];
    return getPaymentsForEducator(currentUser.id);
  }, [currentUser?.id, currentUser?.role]);

  const totals = useMemo(() => {
    const thisYear = new Date().getFullYear();
    let paidThisYear = 0;
    let totalPending = 0;
    for (const p of payments) {
      if (p.status === "paid") {
        const year = p.datePaid ? new Date(p.datePaid).getFullYear() : thisYear;
        if (year === thisYear) paidThisYear += p.amount;
      } else {
        totalPending += p.amount;
      }
    }
    return { paidThisYear, totalPending };
  }, [payments]);

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => {
      const dateA = a.datePaid ?? a.period;
      const dateB = b.datePaid ?? b.period;
      return dateB.localeCompare(dateA);
    }),
    [payments]
  );

  if (!currentUser) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Please log in to view your earnings.</p>
      </div>
    );
  }

  if (currentUser.role !== "educator") {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Access denied. This page is for educators only.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2">
        <Wallet className="w-7 h-7" /> My earnings
      </h1>
      <p className="page-subtitle">
        Your payment history. Only your own payments are shown.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Paid this year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.paidThisYear)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">Planned + Pending status</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4" /> Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>
            Period, type, amount, status, and date paid. Finance team processes payments; contact them for questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.period}</TableCell>
                    <TableCell>{TYPE_LABELS[p.type]}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "paid" ? "default" : p.status === "pending" ? "secondary" : "outline"}
                      >
                        {STATUS_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(p.datePaid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

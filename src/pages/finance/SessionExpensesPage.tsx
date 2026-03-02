import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSessionExpenses } from "@/context/SessionExpensesContext";
import { getSession, getClass, getEducatorName } from "@/mockData";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/financeUtils";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const ALL_STATUSES = "all";

export default function SessionExpensesPage() {
  const { currentUser } = useAuth();
  const { expenses, updateExpense } = useSessionExpenses();
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const reqDate = e.requestedAt.split("T")[0];
      if (reqDate < dateFrom || reqDate > dateTo) return false;
      if (statusFilter !== ALL_STATUSES && e.status !== statusFilter) return false;
      return true;
    });
  }, [expenses, dateFrom, dateTo, statusFilter]);

  const summary = useMemo(() => {
    const requested = expenses.filter((e) => e.status === "requested");
    const issued = expenses.filter((e) => e.status === "issued");
    const paid = expenses.filter((e) => e.status === "paid");
    const sum = (arr: typeof expenses) => arr.reduce((s, e) => s + e.totalRequested, 0);
    return {
      requestedCount: requested.length,
      issuedCount: issued.length,
      paidCount: paid.length,
      totalRequested: sum(requested),
      totalIssued: sum(issued),
      totalPaid: sum(paid),
    };
  }, [expenses]);

  function handleMarkIssued(expense: (typeof expenses)[0]) {
    updateExpense(expense.id, {
      status: "issued",
      issuedAt: new Date().toISOString(),
      processedBy: currentUser?.id,
    });
  }

  function handleMarkPaid(expense: (typeof expenses)[0]) {
    updateExpense(expense.id, {
      status: "paid",
      paidAt: new Date().toISOString(),
      processedBy: currentUser?.id,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Session expenses</h1>
        <p className="text-muted-foreground">
          Educator transport and expense requests. Mark as issued or paid.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Summary
          </CardTitle>
          <CardDescription>Counts and totals by status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <p className="text-sm text-muted-foreground">Requested</p>
            <p className="text-lg font-semibold">{summary.requestedCount}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalRequested)} total
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Issued</p>
            <p className="text-lg font-semibold">{summary.issuedCount}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalIssued)} total
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold">{summary.paidCount}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalPaid)} total
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>By status and requested date range.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">From</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">To</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense requests</CardTitle>
          <CardDescription>
            Mark as issued (money sent) or paid (fully settled).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Educator</TableHead>
                <TableHead>Session / class</TableHead>
                <TableHead>School / org</TableHead>
                <TableHead className="text-right">To</TableHead>
                <TableHead className="text-right">From</TableHead>
                <TableHead className="text-right">Other</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const session = getSession(e.sessionId);
                const cls = session ? getClass(session.classId) : undefined;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">
                      {formatDate(e.requestedAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getEducatorName(e.educatorId)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cls?.name ?? e.sessionId} · {session?.topic ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{e.schoolName}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(e.transportTo)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(e.transportFrom)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(e.otherAmount ?? 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(e.totalRequested)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          e.status === "paid"
                            ? "default"
                            : e.status === "issued"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.status === "requested" && (
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleMarkIssued(e)}
                          >
                            Mark as issued
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(e)}
                          >
                            Mark as paid
                          </Button>
                        </div>
                      )}
                      {e.status === "issued" && (
                        <Button size="sm" onClick={() => handleMarkPaid(e)}>
                          Mark as paid
                        </Button>
                      )}
                      {e.status === "paid" && (
                        <span className="text-xs text-muted-foreground">
                          {e.paidAt && formatDate(e.paidAt)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockEducatorPayments, getEducatorName } from "@/mockData";
import { Wallet } from "lucide-react";
import type { EducatorPaymentType } from "@/types";

const paymentTypeLabels: Record<EducatorPaymentType, string> = {
  stipend: "Stipend",
  salary: "Salary",
  bonus: "Bonus",
};

import { formatCurrency } from "@/lib/financeUtils";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const ALL_PERIODS = "all";
const ALL_STATUSES = "all";

export default function FinanceEducatorPaymentsPage() {
  const [periodFilter, setPeriodFilter] = useState<string>(ALL_PERIODS);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);

  const periods = useMemo(() => {
    const set = new Set(mockEducatorPayments.map((p) => p.period));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    return mockEducatorPayments.filter((p) => {
      if (periodFilter !== ALL_PERIODS && p.period !== periodFilter) return false;
      if (statusFilter !== ALL_STATUSES && p.status !== statusFilter) return false;
      return true;
    });
  }, [periodFilter, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Educator payments</h1>
        <p className="text-muted-foreground">
          Stipends, salaries, and bonuses. Filter by period and status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Payments
          </CardTitle>
          <CardDescription>Read-only. Finance manages entries elsewhere.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Period:</span>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PERIODS}>All periods</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>All</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Educator</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{getEducatorName(p.educatorId)}</TableCell>
                  <TableCell>{p.period}</TableCell>
                  <TableCell>{paymentTypeLabels[p.type]}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === "paid"
                          ? "default"
                          : p.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.datePaid ? formatDate(p.datePaid) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

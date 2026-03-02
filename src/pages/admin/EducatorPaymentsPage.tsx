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
import { mockEducatorPayments, getEducatorName } from "@/mockData";
import { Wallet } from "lucide-react";
import type { EducatorPaymentType } from "@/types";

const paymentTypeLabels: Record<EducatorPaymentType, string> = {
  stipend: "Stipend",
  salary: "Salary",
  bonus: "Bonus",
};

import { formatCurrency } from "@/lib/financeUtils";

export default function EducatorPaymentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salaries</h1>
        <p className="text-muted-foreground">
          Details of team salaries — stipends, salaries, and bonuses by period.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Team salaries
          </CardTitle>
          <CardDescription>
            Salary and payment details by team member and period. Finance handles entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Educator</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Pay type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEducatorPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{getEducatorName(p.educatorId)}</TableCell>
                  <TableCell>{p.period}</TableCell>
                  <TableCell>{paymentTypeLabels[p.type]}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
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

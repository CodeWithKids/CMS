import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import { Receipt } from "lucide-react";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

import { formatCurrency } from "@/lib/financeUtils";

export default function ExpensesPage() {
  const { getExpenses } = useFinanceAccount();
  const expenses = getExpenses();
  const byPeriod = useMemo(() => {
    const map = new Map<string, { total: number; items: typeof expenses }>();
    for (const ex of expenses) {
      const period = new Date(ex.date).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
      const existing = map.get(period);
      if (!existing) {
        map.set(period, { total: ex.amount, items: [ex] });
      } else {
        existing.total += ex.amount;
        existing.items.push(ex);
      }
    }
    return Array.from(map.entries()).sort((a, b) => {
      const dateA = a[1].items[0]?.date ?? "";
      const dateB = b[1].items[0]?.date ?? "";
      return dateB.localeCompare(dateA);
    });
  }, [expenses]);

  const grandTotal = useMemo(
    () => expenses.reduce((sum, ex) => sum + ex.amount, 0),
    [expenses]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses overview</h1>
        <p className="text-muted-foreground">
          Summary of expenses by month/term. Finance handles entry; this is a high-level view.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Total expenses
          </CardTitle>
          <CardDescription>All-time total across categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(grandTotal)}</p>
        </CardContent>
      </Card>

      {byPeriod.map(([period, { total, items }]) => (
        <Card key={period}>
          <CardHeader>
            <CardTitle>{period}</CardTitle>
            <CardDescription>
              Category breakdown · Total: {formatCurrency(total)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ex) => (
                  <TableRow key={ex.id}>
                    <TableCell className="font-medium">{EXPENSE_CATEGORY_LABELS[ex.category]}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ex.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(ex.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getFinanceAccountExpenses } from "@/mockData";
import { Receipt } from "lucide-react";
import { EXPENSE_CATEGORY_LABELS, MONTHLY_EXPENSE_CATEGORIES } from "@/types";
import type { ExpenseCategoryType } from "@/types";

import { formatCurrency } from "@/lib/financeUtils";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const ALL_CATEGORIES = "all";

export default function FinanceExpensesPage() {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  const filtered = useMemo(() => {
    return getFinanceAccountExpenses().filter((ex) => {
      if (ex.date < dateFrom || ex.date > dateTo) return false;
      if (categoryFilter !== ALL_CATEGORIES && ex.category !== categoryFilter) return false;
      return true;
    });
  }, [dateFrom, dateTo, categoryFilter]);

  const totalExpenses = useMemo(
    () => filtered.reduce((sum, ex) => sum + ex.amount, 0),
    [filtered]
  );

  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategoryType, number>();
    for (const ex of filtered) {
      map.set(ex.category, (map.get(ex.category) ?? 0) + ex.amount);
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Group by month (YYYY-MM), then by monthly expense category
  const byMonthWithCategories = useMemo(() => {
    const byMonth = new Map<
      string,
      { total: number; byCategory: Map<ExpenseCategoryType, number>; items: typeof filtered }
    >();
    for (const ex of filtered) {
      const monthKey = ex.date.slice(0, 7);
      let entry = byMonth.get(monthKey);
      if (!entry) {
        entry = { total: 0, byCategory: new Map(), items: [] };
        byMonth.set(monthKey, entry);
      }
      entry.total += ex.amount;
      entry.byCategory.set(ex.category, (entry.byCategory.get(ex.category) ?? 0) + ex.amount);
      entry.items.push(ex);
    }
    return Array.from(byMonth.entries())
      .map(([monthKey, data]) => ({
        monthKey,
        monthLabel: new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(
          new Date(monthKey + "-01")
        ),
        ...data,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filtered]);

  const categories = useMemo(() => {
    const set = new Set(getFinanceAccountExpenses().map((e) => e.category));
    return Array.from(set).sort();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          All expenses. Filter by date range and category.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Total expenses (filtered)
          </CardTitle>
          <CardDescription>
            Total for selected date range and category: {formatCurrency(totalExpenses)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byCategory.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Breakdown by category</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byCategory.map(({ category, total }) => (
                    <TableRow key={category}>
                      <TableCell>{EXPENSE_CATEGORY_LABELS[category]}</TableCell>
                      <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly expenses by month: salaries, rent, utilities, etc. */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly expenses by month</CardTitle>
          <CardDescription>
            Salaries, rent, water, electricity, internet, office supplies, toiletries, and consumables per month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {byMonthWithCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses in the selected date range.</p>
          ) : (
            byMonthWithCategories.map(({ monthKey, monthLabel, total, byCategory: monthByCat }) => (
              <div key={monthKey} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold">{monthLabel}</h3>
                  <span className="text-sm text-muted-foreground">
                    Month total: {formatCurrency(total)}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MONTHLY_EXPENSE_CATEGORIES.map((cat) => {
                      const amount = monthByCat.get(cat) ?? 0;
                      return (
                        <TableRow key={cat}>
                          <TableCell className="text-muted-foreground">
                            {EXPENSE_CATEGORY_LABELS[cat]}
                          </TableCell>
                          <TableCell className="text-right">
                            {amount > 0 ? formatCurrency(amount) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Date range and category.</CardDescription>
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense entries</CardTitle>
          <CardDescription>Date, category, description, amount, paid to, reference.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Paid to</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell className="text-sm">{formatDate(ex.date)}</TableCell>
                  <TableCell>{EXPENSE_CATEGORY_LABELS[ex.category]}</TableCell>
                  <TableCell className="text-sm">{ex.description}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(ex.amount)}
                  </TableCell>
                  <TableCell className="text-sm">{ex.paidTo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ex.reference ?? "—"}
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

import { useMemo, useState } from "react";
import { getFinanceAccountInvoices, getFinanceAccountExpenses } from "@/mockData";
import { getMonthlyFinanceSummaryForYear, getYearTotals } from "@/utils/financeAggregation";
import { formatCurrency } from "@/lib/financeUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Receipt, Minus } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getAvailableYears(invoices: { dueDate?: string; paidDate?: string }[], expenses: { date: string }[]): number[] {
  const years = new Set<number>();
  for (const inv of invoices) {
    const d = inv.paidDate ?? inv.dueDate;
    if (d) {
      const y = new Date(d).getFullYear();
      if (!Number.isNaN(y)) years.add(y);
    }
  }
  for (const ex of expenses) {
    const y = new Date(ex.date).getFullYear();
    if (!Number.isNaN(y)) years.add(y);
  }
  const arr = Array.from(years).sort((a, b) => a - b);
  if (arr.length === 0) arr.push(new Date().getFullYear());
  return arr;
}

export default function YearOverviewPage() {
  const availableYears = useMemo(() => getAvailableYears(getFinanceAccountInvoices(), getFinanceAccountExpenses()), []);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(() =>
    availableYears.includes(currentYear) ? currentYear : (availableYears[0] ?? currentYear)
  );

  const monthlySummary = useMemo(
    () => getMonthlyFinanceSummaryForYear(year, getFinanceAccountInvoices(), getFinanceAccountExpenses()),
    [year]
  );

  const yearTotals = useMemo(() => getYearTotals(monthlySummary), [monthlySummary]);

  const chartData = useMemo(
    () =>
      monthlySummary.map((row) => ({
        name: MONTH_NAMES[row.month - 1],
        month: row.month,
        income: row.income,
        expenses: row.expenses,
        net: row.net,
      })),
    [monthlySummary]
  );

  const isCurrentYear = year === currentYear;
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="page-container">
      <h1 className="page-title">Year overview</h1>
      <p className="page-subtitle">
        Monthly income, expenses, and net result by year.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-muted-foreground">Year</label>
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(Number(v))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Total income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(yearTotals.totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">Paid & partially paid invoices in {year}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Total expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(yearTotals.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Expenses in {year}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Minus className="w-4 h-4" /> Net result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                yearTotals.totalNet >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(yearTotals.totalNet)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Income − expenses</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Income vs expenses by month</CardTitle>
          <CardDescription>Bar chart for {year}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `${label} ${year}`}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#0d9488" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ea580c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly table</CardTitle>
          <CardDescription>Income, expenses, and net per month for {year}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlySummary.map((row) => {
                const isCurrentMonth = isCurrentYear && row.month === currentMonth;
                return (
                  <TableRow key={row.month} className={isCurrentMonth ? "bg-muted/50" : undefined}>
                    <TableCell className="font-medium">
                      {MONTH_NAMES[row.month - 1]}
                      {isCurrentMonth && (
                        <span className="ml-2 text-xs text-muted-foreground">(current)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.income)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.expenses)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        row.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(row.net)}
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

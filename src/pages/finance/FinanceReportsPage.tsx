import { useMemo, useState } from "react";
import { useInvoices, useFinance } from "@/context/FinanceContext";
import { useSessions } from "@/context/SessionsContext";
import { mockTerms, getEducatorName } from "@/mockData";
import { getOrganization } from "@/mockData";
import { getLearner } from "@/mockData";
import { formatCurrency } from "@/lib/financeUtils";
import { calculateEducatorHoursByTerm, filterEducatorHoursByTerm } from "@/utils/educatorHours";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart2 } from "lucide-react";

type ReportTab = "income_term" | "income_programme" | "adjustments" | "educator_cost";

export default function FinanceReportsPage() {
  const [termId, setTermId] = useState(mockTerms[0]?.id ?? "t1");
  const [reportType, setReportType] = useState<ReportTab>("income_term");

  const allInvoices = useInvoices({ termId });
  const { adjustmentRequests } = useFinance();
  const { sessions } = useSessions();

  const incomeByTerm = useMemo(() => {
    const list = allInvoices;
    const gross = list.reduce((s, i) => s + i.grossAmount, 0);
    const discounts = list.reduce((s, i) => s + i.discountAmount, 0);
    const net = list.reduce((s, i) => s + i.netAmount, 0);
    const paid = list.reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = list.reduce((s, i) => s + Math.max(0, i.balance), 0);
    return { gross, discounts, net, paid, outstanding };
  }, [allInvoices]);

  const incomeByProgramme = useMemo(() => {
    const byProgramme = new Map<string, { gross: number; discounts: number; net: number; paid: number }>();
    for (const inv of allInvoices) {
      const key = inv.programmeId ?? "—";
      const cur = byProgramme.get(key) ?? { gross: 0, discounts: 0, net: 0, paid: 0 };
      byProgramme.set(key, {
        gross: cur.gross + inv.grossAmount,
        discounts: cur.discounts + inv.discountAmount,
        net: cur.net + inv.netAmount,
        paid: cur.paid + inv.amountPaid,
      });
    }
    return Array.from(byProgramme.entries()).map(([programme, data]) => ({ programme, ...data }));
  }, [allInvoices]);

  const incomeByPartner = useMemo(() => {
    const byPayer = new Map<string, { name: string; gross: number; net: number; paid: number }>();
    for (const inv of allInvoices) {
      const key = inv.payerType === "organisation" ? (inv.organisationId ?? inv.payerId) : inv.payerId;
      let name = key;
      if (inv.payerType === "organisation") name = getOrganization(key)?.name ?? key;
      else if (inv.learnerId) name = getLearner(inv.learnerId) ? `${getLearner(inv.learnerId)!.firstName} ${getLearner(inv.learnerId)!.lastName}` : key;
      const cur = byPayer.get(key) ?? { name, gross: 0, net: 0, paid: 0 };
      byPayer.set(key, {
        name: cur.name,
        gross: cur.gross + inv.grossAmount,
        net: cur.net + inv.netAmount,
        paid: cur.paid + inv.amountPaid,
      });
    }
    return Array.from(byPayer.values());
  }, [allInvoices]);

  const adjustmentsSummary = useMemo(() => {
    const approved = adjustmentRequests.filter((r) => r.status === "approved");
    const discountTotal = approved.filter((r) => r.type === "discount").reduce((s, r) => s + (r.discountAmount ?? 0), 0);
    const refundTotal = approved.filter((r) => r.type === "refund").reduce((s, r) => s + (r.refundAmount ?? 0), 0);
    const byReason = new Map<string, number>();
    for (const r of approved) {
      const label = r.reason.slice(0, 30);
      byReason.set(label, (byReason.get(label) ?? 0) + (r.type === "discount" ? (r.discountAmount ?? 0) : (r.refundAmount ?? 0)));
    }
    return {
      discountTotal,
      refundTotal,
      byReason: Array.from(byReason.entries()).map(([reason, amount]) => ({ reason, amount })),
    };
  }, [adjustmentRequests]);

  const educatorCostBasis = useMemo(() => {
    const summaries = filterEducatorHoursByTerm(calculateEducatorHoursByTerm(sessions), termId);
    return summaries.sort((a, b) => b.totalHours - a.totalHours);
  }, [sessions, termId]);

  const termName = mockTerms.find((t) => t.id === termId)?.name ?? termId;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Income by term, by programme/partner, adjustments summary, and educator cost basis.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={termId} onValueChange={setTermId}>
          <SelectTrigger className="w-[200px]">
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
        <Select value={reportType} onValueChange={(v) => setReportType(v as ReportTab)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income_term">Income by term</SelectItem>
            <SelectItem value="income_programme">Income by programme / partner</SelectItem>
            <SelectItem value="adjustments">Adjustments summary</SelectItem>
            <SelectItem value="educator_cost">Educator cost basis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportType === "income_term" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" /> Income by term
            </CardTitle>
            <CardDescription>Term: {termName}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Gross invoiced</TableCell>
                  <TableCell className="text-right">{formatCurrency(incomeByTerm.gross)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Discounts given</TableCell>
                  <TableCell className="text-right">-{formatCurrency(incomeByTerm.discounts)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Net invoiced</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(incomeByTerm.net)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payments received</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">{formatCurrency(incomeByTerm.paid)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Outstanding balances</TableCell>
                  <TableCell className="text-right">{formatCurrency(incomeByTerm.outstanding)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === "income_programme" && (
        <Card>
          <CardHeader>
            <CardTitle>Income by programme / partner</CardTitle>
            <CardDescription>Term: {termName}. Grouped by programme and by payer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">By programme</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programme</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeByProgramme.map((row) => (
                    <TableRow key={row.programme}>
                      <TableCell>{row.programme}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.gross)}</TableCell>
                      <TableCell className="text-right">-{formatCurrency(row.discounts)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.net)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.paid)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">By partner (payer)</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payer</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeByPartner.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.gross)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.net)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.paid)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "adjustments" && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustments summary</CardTitle>
            <CardDescription>Totals for approved discounts and refunds/credits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Discounts total</p>
                <p className="text-xl font-bold">{formatCurrency(adjustmentsSummary.discountTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Refunds / credit notes total</p>
                <p className="text-xl font-bold">{formatCurrency(adjustmentsSummary.refundTotal)}</p>
              </div>
            </div>
            {adjustmentsSummary.byReason.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason (summary)</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustmentsSummary.byReason.map(({ reason, amount }) => (
                    <TableRow key={reason}>
                      <TableCell className="text-muted-foreground text-sm">{reason}</TableCell>
                      <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === "educator_cost" && (
        <Card>
          <CardHeader>
            <CardTitle>Educator cost basis</CardTitle>
            <CardDescription>
              Term: {termName}. Hours per educator (facilitating vs coaching).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {educatorCostBasis.length === 0 ? (
              <p className="text-sm text-muted-foreground">No session data for this term.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Educator</TableHead>
                    <TableHead className="text-right">Facilitating (h)</TableHead>
                    <TableHead className="text-right">Coaching (h)</TableHead>
                    <TableHead className="text-right">Total (h)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {educatorCostBasis.map((row) => (
                    <TableRow key={row.educatorId}>
                      <TableCell>{getEducatorName(row.educatorId)}</TableCell>
                      <TableCell className="text-right">{row.leadHours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{row.coachingHours.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-medium">{row.totalHours.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

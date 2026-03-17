import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useInvoices } from "@/context/FinanceContext";
import { useTerms } from "@/hooks/useTerms";
import { getLearner } from "@/mockData";
import { getOrganization } from "@/mockData";
import { formatCurrency } from "@/lib/financeUtils";
import { INVOICE_STATUS_LABELS, PAYER_TYPE_LABELS } from "@/types/finance";
import type { FinanceInvoice } from "@/types/finance";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ALL_TERMS = "all";
const ALL_STATUSES = "all";
const ALL_PAYER_TYPES = "all";

function getPayerName(inv: FinanceInvoice): string {
  if (inv.payerType === "parent" && inv.learnerId) {
    const learner = getLearner(inv.learnerId);
    return learner ? `${learner.firstName} ${learner.lastName}` : inv.learnerId;
  }
  const org = getOrganization(inv.payerId);
  return org?.name ?? inv.payerId;
}

function getLearnerOrOrgLabel(inv: FinanceInvoice): string {
  if (inv.learnerId) {
    const learner = getLearner(inv.learnerId);
    return learner ? `Learner: ${learner.firstName} ${learner.lastName}` : inv.learnerId;
  }
  const org = getOrganization(inv.organisationId ?? inv.payerId);
  return org ? `Org: ${org.name}` : inv.payerId;
}

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const statusFilter = statusParam ?? ALL_STATUSES;
  const { terms: termOptions } = useTerms();

  const [termFilter, setTermFilter] = useState(ALL_TERMS);

  // Ensure Select value is always valid (API terms have ids like t-xxx, not "t1")
  const termSelectValue =
    termFilter === ALL_TERMS || termOptions.some((t) => t.id === termFilter) ? termFilter : ALL_TERMS;
  const [payerTypeFilter, setPayerTypeFilter] = useState(ALL_PAYER_TYPES);
  const [loadError, setLoadError] = useState(false);

  const termInvoices = useInvoices(
    termFilter !== ALL_TERMS ? { termId: termFilter } : undefined
  );

  const filtered = useMemo(() => {
    let list = termInvoices;
    if (statusFilter !== ALL_STATUSES) {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (payerTypeFilter !== ALL_PAYER_TYPES) {
      list = list.filter((i) => i.payerType === payerTypeFilter);
    }
    return list;
  }, [termInvoices, statusFilter, payerTypeFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Filter by term, payer type, and status. Click a row to open the invoice detail.
          </p>
        </div>
        {statusFilter === "overdue" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Viewing overdue invoices
          </span>
        )}
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load invoices.{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={() => setLoadError(false)}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Invoice list
          </CardTitle>
          <CardDescription>
            {filtered.length > 0
              ? `Showing ${filtered.length} invoice${filtered.length === 1 ? "" : "s"} for the selected filters.`
              : "No invoices for the current filters."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select value={termSelectValue} onValueChange={setTermFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TERMS}>All terms</SelectItem>
                {termOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={payerTypeFilter} onValueChange={setPayerTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Payer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PAYER_TYPES}>All payers</SelectItem>
                <SelectItem value="parent">{PAYER_TYPE_LABELS.parent}</SelectItem>
                <SelectItem value="organisation">{PAYER_TYPE_LABELS.organisation}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                const params = new URLSearchParams(searchParams);
                if (v === ALL_STATUSES) params.delete("status");
                else params.set("status", v);
                const q = params.toString();
                navigate({ search: q ? `?${q}` : "" }, { replace: true });
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                {(Object.keys(INVOICE_STATUS_LABELS) as Array<keyof typeof INVOICE_STATUS_LABELS>).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {INVOICE_STATUS_LABELS[s]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground space-y-2">
              <p>No invoices match the current filters.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTermFilter(ALL_TERMS);
                  setPayerTypeFilter(ALL_PAYER_TYPES);
                  const params = new URLSearchParams(searchParams);
                  params.delete("status");
                  const q = params.toString();
                  navigate({ search: q ? `?${q}` : "" }, { replace: true });
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Learner / Org</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer" onClick={() => navigate(`/finance/invoices/${inv.id}`)}>
                    <TableCell className="font-medium">
                      <Link to={`/finance/invoices/${inv.id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {inv.id}
                      </Link>
                    </TableCell>
                      <TableCell>{getPayerName(inv)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getLearnerOrOrgLabel(inv)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {mockTerms.find((t) => t.id === inv.termId)?.name ?? inv.termId}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.grossAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.discountAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.netAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.amountPaid)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.balance)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted">
                          {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.dueDate}</TableCell>
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

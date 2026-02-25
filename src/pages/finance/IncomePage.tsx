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
import { Input } from "@/components/ui/input";
import { getPaidAmount, formatCurrency } from "@/lib/financeUtils";
import { mockInvoices, getLearner, getOrganization, getCurrentTerm } from "@/mockData";
import {
  INVOICE_SOURCE_LABELS,
  getIncomeSessionTypeFromSource,
  getIncomePayerTypeFromSource,
  INCOME_SESSION_TYPE_LABELS,
  INCOME_PAYER_TYPE_LABELS,
} from "@/types";
import type { InvoiceSource, IncomeSessionType, IncomePayerType } from "@/types";
import type { Invoice } from "@/types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Effective session type for an invoice (stored or derived from source). */
function getEffectiveSessionType(inv: Invoice): IncomeSessionType {
  return inv.sessionType ?? getIncomeSessionTypeFromSource(inv.source);
}

/** Effective payer type for an invoice (stored or derived from source). */
function getEffectivePayerType(inv: Invoice): IncomePayerType {
  return inv.payerType ?? getIncomePayerTypeFromSource(inv.source);
}

/** Received amount: paid → totalAmount, partially_paid → paidAmount. */
function getIncomeAmount(inv: Invoice): number {
  if (inv.status === "paid") return inv.totalAmount;
  if (inv.status === "partially_paid") return inv.paidAmount ?? Math.round(inv.totalAmount * 0.5);
  return 0;
}

/** Display amount in table: received amount, or for unpaid show totalAmount (outstanding). */
function getDisplayAmount(inv: Invoice): number {
  const received = getIncomeAmount(inv);
  if (received > 0) return received;
  return inv.status === "sent" || inv.status === "draft" ? inv.totalAmount : 0;
}

const ALL = "all";

export default function FinanceIncomePage() {
  const currentTerm = getCurrentTerm();
  const termStart = currentTerm?.startDate ?? "2025-01-01";
  const termEnd = currentTerm?.endDate ?? "2025-12-31";

  const [dateFrom, setDateFrom] = useState(termStart);
  const [dateTo, setDateTo] = useState(termEnd);
  const [sourceFilter, setSourceFilter] = useState<string>(ALL);
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>(ALL);
  const [organisationFilter, setOrganisationFilter] = useState<string>(ALL);
  const [payerTypeFilter, setPayerTypeFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const entries = useMemo(() => {
    return mockInvoices.map((inv) => {
      const payerLabel =
        inv.organizationId != null
          ? (getOrganization(inv.organizationId)?.name ?? "—")
          : inv.learnerId != null
            ? (() => {
                const learner = getLearner(inv.learnerId!);
                return learner ? `${learner.firstName} ${learner.lastName}` : "—";
              })()
            : "—";
      const description = inv.description ?? null;
      const date = inv.paidDate ?? inv.dueDate;
      const amount = getDisplayAmount(inv);
      const statusLabel =
        inv.status === "paid"
          ? "Paid"
          : inv.status === "partially_paid"
            ? "Partially paid"
            : "Unpaid";
      const sessionType = getEffectiveSessionType(inv);
      const payerType = getEffectivePayerType(inv);
      return { inv, payerLabel, description, date, amount, statusLabel, sessionType, payerType };
    });
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (e.date < dateFrom || e.date > dateTo) return false;
      if (sourceFilter !== ALL && e.inv.source !== sourceFilter) return false;
      if (sessionTypeFilter !== ALL && e.sessionType !== sessionTypeFilter) return false;
      if (organisationFilter !== ALL && (e.inv.organizationId ?? "none") !== organisationFilter) return false;
      if (payerTypeFilter !== ALL && e.payerType !== payerTypeFilter) return false;
      if (statusFilter !== ALL) {
        if (statusFilter === "paid" && e.inv.status !== "paid") return false;
        if (statusFilter === "partially_paid" && e.inv.status !== "partially_paid") return false;
        if (statusFilter === "unpaid" && (e.inv.status === "paid" || e.inv.status === "partially_paid")) return false;
      }
      return true;
    });
  }, [entries, dateFrom, dateTo, sourceFilter, sessionTypeFilter, organisationFilter, payerTypeFilter, statusFilter]);

  const totalIncome = useMemo(
    () => filtered.reduce((sum, e) => sum + getIncomeAmount(e.inv), 0),
    [filtered]
  );

  // Income received (paid amounts only) in filtered set for summary cards
  const receivedInFilter = useMemo(
    () => filtered.filter((e) => getIncomeAmount(e.inv) > 0),
    [filtered]
  );

  // Summary by programme (sessionType) + payerType for "this term" style cards
  const summaryByProgrammeAndPayer = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of receivedInFilter) {
      const key = `${e.sessionType}|${e.payerType}`;
      map.set(key, (map.get(key) ?? 0) + getIncomeAmount(e.inv));
    }
    return Array.from(map.entries()).map(([key, total]) => {
      const [sessionType, payerType] = key.split("|") as [IncomeSessionType, IncomePayerType];
      return { sessionType, payerType, total };
    });
  }, [receivedInFilter]);

  // Summary by organisation (only entries with organizationId)
  const summaryByOrganisation = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of receivedInFilter) {
      const orgId = e.inv.organizationId ?? "_no_org";
      if (orgId === "_no_org") continue;
      map.set(orgId, (map.get(orgId) ?? 0) + getIncomeAmount(e.inv));
    }
    return Array.from(map.entries()).map(([orgId, total]) => ({ orgId, total }));
  }, [receivedInFilter]);

  const sources = useMemo(() => {
    const set = new Set(mockInvoices.map((i) => i.source));
    return Array.from(set).sort();
  }, []);

  const organisations = useMemo(() => {
    const set = new Set(mockInvoices.map((i) => i.organizationId).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, []);

  const sessionTypes = useMemo(() => {
    const set = new Set(entries.map((e) => e.sessionType));
    return Array.from(set).sort();
  }, [entries]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Income</h1>
        <p className="text-muted-foreground">
          Report by session type, organisation, programme, and payer type. Filter and view summary cards below.
        </p>
      </div>

      {/* Summary cards: Makerspace – Parent, School clubs – School, Organisation programmes – Partner */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { sessionType: "MAKERSPACE" as const, payerType: "PARENT" as const, label: "Makerspace – Parent income" },
          { sessionType: "SCHOOL_STEM_CLUB" as const, payerType: "SCHOOL" as const, label: "School clubs – School income" },
          { sessionType: "ORGANISATION_SESSION" as const, payerType: "ORGANISATION" as const, label: "Organisation programmes – Partner income" },
        ].map(({ sessionType, payerType, label }) => {
          const total = summaryByProgrammeAndPayer.find(
            (s) => s.sessionType === sessionType && s.payerType === payerType
          )?.total ?? 0;
          const miradiTotal = sessionType === "ORGANISATION_SESSION"
            ? summaryByProgrammeAndPayer.filter(
                (s) => (s.sessionType === "ORGANISATION_SESSION" || s.sessionType === "MIRADI_SESSION") && s.payerType === "ORGANISATION"
              ).reduce((sum, s) => sum + s.total, 0)
            : total;
          const displayTotal = sessionType === "ORGANISATION_SESSION" ? miradiTotal : total;
          return (
            <Card key={`${sessionType}-${payerType}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{label}</CardTitle>
                <CardDescription>Selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(displayTotal)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Group totals by session type and by payer type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By programme (session type)</CardTitle>
            <CardDescription>Received income by session type</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {(["MAKERSPACE", "SCHOOL_STEM_CLUB", "HOME_SESSION", "ORGANISATION_SESSION", "MIRADI_SESSION", "OTHER"] as IncomeSessionType[]).map((st) => {
                const total = summaryByProgrammeAndPayer
                  .filter((s) => s.sessionType === st)
                  .reduce((sum, s) => sum + s.total, 0);
                if (total === 0) return null;
                return (
                  <li key={st} className="flex justify-between">
                    <span>{INCOME_SESSION_TYPE_LABELS[st]}</span>
                    <span>{formatCurrency(total)}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By payer type</CardTitle>
            <CardDescription>Parent vs School vs Organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {(["PARENT", "SCHOOL", "ORGANISATION"] as IncomePayerType[]).map((pt) => {
                const total = summaryByProgrammeAndPayer
                  .filter((s) => s.payerType === pt)
                  .reduce((sum, s) => sum + s.total, 0);
                return (
                  <li key={pt} className="flex justify-between">
                    <span>{INCOME_PAYER_TYPE_LABELS[pt]}</span>
                    <span>{formatCurrency(total)}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* By organisation */}
      {summaryByOrganisation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By organisation / school</CardTitle>
            <CardDescription>Received income per organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {summaryByOrganisation.map(({ orgId, total }) => (
                <li key={orgId} className="flex justify-between">
                  <span>{getOrganization(orgId)?.name ?? orgId}</span>
                  <span>{formatCurrency(total)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Date range, session type, organisation, payer type, and status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">From</span>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">To</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
          {currentTerm && (
            <button
              type="button"
              onClick={() => { setDateFrom(termStart); setDateTo(termEnd); }}
              className="text-sm text-primary hover:underline"
            >
              This term ({currentTerm.name})
            </button>
          )}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{INVOICE_SOURCE_LABELS[s as InvoiceSource]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Session type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All session types</SelectItem>
              {sessionTypes.map((st) => (
                <SelectItem key={st} value={st}>{INCOME_SESSION_TYPE_LABELS[st as IncomeSessionType]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={organisationFilter} onValueChange={setOrganisationFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Organisation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All organisations</SelectItem>
              {organisations.map((orgId) => (
                <SelectItem key={orgId} value={orgId}>{getOrganization(orgId)?.name ?? orgId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={payerTypeFilter} onValueChange={setPayerTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Payer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All payer types</SelectItem>
              <SelectItem value="PARENT">{INCOME_PAYER_TYPE_LABELS.PARENT}</SelectItem>
              <SelectItem value="SCHOOL">{INCOME_PAYER_TYPE_LABELS.SCHOOL}</SelectItem>
              <SelectItem value="ORGANISATION">{INCOME_PAYER_TYPE_LABELS.ORGANISATION}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total income (filtered)</CardTitle>
          <CardDescription>{formatCurrency(totalIncome)} for selected filters</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income entries</CardTitle>
          <CardDescription>From invoices. Columns show session type, payer type, and client.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Session type</TableHead>
                <TableHead>Payer type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Client / description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.inv.id}>
                  <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell className="text-sm">{INCOME_SESSION_TYPE_LABELS[e.sessionType]}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{INCOME_PAYER_TYPE_LABELS[e.payerType]}</TableCell>
                  <TableCell>{INVOICE_SOURCE_LABELS[e.inv.source]}</TableCell>
                  <TableCell>
                    <span className="font-medium">{e.payerLabel}</span>
                    {e.description && (
                      <span className="text-muted-foreground text-sm block">{e.description}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(e.amount)}
                    {e.inv.status !== "paid" && e.inv.status !== "partially_paid" && (
                      <span className="text-muted-foreground text-xs block">outstanding</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.inv.status === "paid" ? "default" : "secondary"}>{e.statusLabel}</Badge>
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

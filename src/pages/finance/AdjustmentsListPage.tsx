import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePendingAdjustments, useFinance } from "@/context/FinanceContext";
import { getLearner } from "@/mockData";
import { getOrganization } from "@/mockData";
import type { FinanceInvoice } from "@/types/finance";
import type { AdjustmentRequest } from "@/types/finance";
import { ADJUSTMENT_TYPE_LABELS } from "@/types/finance";
import { formatCurrency } from "@/lib/financeUtils";
import { TrendingUp } from "lucide-react";

function getPayerNameFromInvoice(inv: FinanceInvoice | undefined): string {
  if (!inv) return "—";
  if (inv.payerType === "parent" && inv.learnerId) {
    const learner = getLearner(inv.learnerId);
    return learner ? `${learner.firstName} ${learner.lastName}` : inv.learnerId;
  }
  const org = getOrganization(inv.payerId);
  return org?.name ?? inv.payerId;
}

function getRequestedAmount(req: AdjustmentRequest): number | string {
  if (req.type === "discount") {
    if (req.discountAmount != null) return req.discountAmount;
    if (req.discountPercent != null) return `${req.discountPercent}%`;
    return "—";
  }
  return req.refundAmount ?? "—";
}

export default function AdjustmentsListPage() {
  const pending = usePendingAdjustments();
  const { getInvoice: getInvoiceFn } = useFinance();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Adjustment requests</h1>
        <p className="text-muted-foreground">
          Pending discount and refund requests. Open a row to approve or reject.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Pending adjustments
          </CardTitle>
          <CardDescription>
            All requests with status &quot;Pending&quot;. Only authorised users can approve or reject.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">No pending adjustment requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead className="text-right">Requested amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Requested at</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((req) => {
                  const inv = getInvoiceFn(req.invoiceId);
                  const amount = getRequestedAmount(req);
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {ADJUSTMENT_TYPE_LABELS[req.type]}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/finance/invoices/${req.invoiceId}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {req.invoiceId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getPayerNameFromInvoice(inv)}
                      </TableCell>
                      <TableCell className="text-right">
                        {typeof amount === "number" ? formatCurrency(amount) : amount}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {req.reason}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{req.requestedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.requestedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Link to={`/finance/adjustments/${req.id}`}>
                          <span className="text-primary hover:underline text-sm">Review</span>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

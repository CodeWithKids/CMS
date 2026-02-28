import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  useInvoice,
  usePaymentsForInvoice,
  useAdjustmentsForInvoice,
  useCreditNotesForInvoice,
  useFinance,
} from "@/context/FinanceContext";
import { canRecordPayment, canRequestAdjustment } from "@/features/finance/lib/permissions";
import { PaymentDialog } from "@/features/invoices/components/PaymentDialog";
import { AdjustmentRequestDialog } from "@/features/invoices/components/AdjustmentRequestDialog";
import { mockTerms } from "@/mockData";
import { getLearner } from "@/mockData";
import { getOrganization } from "@/mockData";
import { formatCurrency } from "@/lib/financeUtils";
import {
  INVOICE_STATUS_LABELS,
  PAYER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  ADJUSTMENT_TYPE_LABELS,
  ADJUSTMENT_STATUS_LABELS,
  REFUND_APPLICATION_LABELS,
} from "@/types/finance";
import type { FinanceInvoice } from "@/types/finance";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, DollarSign, List, CreditCard } from "lucide-react";

function getPayerName(inv: FinanceInvoice): string {
  if (inv.payerType === "parent" && inv.learnerId) {
    const learner = getLearner(inv.learnerId);
    return learner ? `${learner.firstName} ${learner.lastName}` : inv.learnerId;
  }
  const org = getOrganization(inv.payerId);
  return org?.name ?? inv.payerId;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const invoice = useInvoice(id);
  const payments = usePaymentsForInvoice(id);
  const adjustments = useAdjustmentsForInvoice(id);
  const creditNotes = useCreditNotesForInvoice(id);
  const { recordPayment, createAdjustmentRequest } = useFinance();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const canRecord = canRecordPayment(currentUser);
  const canRequest = canRequestAdjustment(currentUser);

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Link to="/finance/invoices" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to invoices
        </Link>
      </div>
    );
  }

  const payerName = getPayerName(invoice);
  const termName = mockTerms.find((t) => t.id === invoice.termId)?.name ?? invoice.termId;

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumbs
        items={[
          { label: "Finance", href: "/finance/dashboard" },
          { label: "Invoices", href: "/finance/invoices" },
          { label: invoice.invoiceNumber ?? invoice.id },
        ]}
        className="mb-4"
      />
      <Link
        to="/finance/invoices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to invoices
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Invoice {invoice.id}
          </CardTitle>
          <CardDescription>
            Payer: {payerName} · {PAYER_TYPE_LABELS[invoice.payerType]} · Term: {termName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-muted-foreground">Status:</span>{" "}
            {INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS]}
          </p>
          <p>
            <span className="font-medium text-muted-foreground">Due date:</span> {invoice.dueDate}
          </p>
          {invoice.issueDate && (
            <p>
              <span className="font-medium text-muted-foreground">Issue date:</span> {invoice.issueDate}
            </p>
          )}
          {invoice.learnerId && (
            <p>
              <span className="font-medium text-muted-foreground">Learner:</span>{" "}
              {getLearner(invoice.learnerId)
                ? `${getLearner(invoice.learnerId)!.firstName} ${getLearner(invoice.learnerId)!.lastName}`
                : invoice.learnerId}
            </p>
          )}
          {invoice.programmeId && (
            <p>
              <span className="font-medium text-muted-foreground">Programme:</span> {invoice.programmeId}
            </p>
          )}
          {invoice.trackId && (
            <p>
              <span className="font-medium text-muted-foreground">Track:</span> {invoice.trackId}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Amount breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross amount</span>
            <span>{formatCurrency(invoice.grossAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discounts</span>
            <span>-{formatCurrency(invoice.discountAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Net amount</span>
            <span>{formatCurrency(invoice.netAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount paid</span>
            <span className="text-green-600 dark:text-green-400">{formatCurrency(invoice.amountPaid)}</span>
          </div>
          {creditNotes.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credit notes applied</span>
              <span>{creditNotes.length} note(s)</span>
            </div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Current balance</span>
            <span>{formatCurrency(invoice.balance)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {canRecord && invoice.balance > 0 && (
          <Button onClick={() => setPaymentOpen(true)}>
            <CreditCard className="w-4 h-4 mr-2" /> Record payment
          </Button>
        )}
        {canRequest && (
          <>
            <Button variant="outline" onClick={() => setDiscountOpen(true)}>
              Request discount
            </Button>
            <Button variant="outline" onClick={() => setRefundOpen(true)}>
              Request refund / credit
            </Button>
          </>
        )}
      </div>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" /> Payments
            </CardTitle>
            <CardDescription>Recorded payments for this invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                  <span>
                    {p.date} · {PAYMENT_METHOD_LABELS[p.method]}
                    {p.reference && ` · ${p.reference}`}
                  </span>
                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(adjustments.length > 0 || creditNotes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustments & credit notes</CardTitle>
            <CardDescription>
              Discount and refund requests, and credit notes linked to this invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adjustments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Adjustment requests</p>
                <ul className="space-y-2">
                  {adjustments.map((a) => (
                    <li key={a.id} className="text-sm py-2 border-b last:border-0">
                      <span className="font-medium">{ADJUSTMENT_TYPE_LABELS[a.type]}</span> ·{" "}
                      {ADJUSTMENT_STATUS_LABELS[a.status as keyof typeof ADJUSTMENT_STATUS_LABELS]} · {a.reason}
                      {a.approvedBy && ` · Approved by ${a.approvedBy}`}
                      {a.rejectedBy && ` · Rejected by ${a.rejectedBy}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {creditNotes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Credit notes</p>
                <ul className="space-y-2">
                  {creditNotes.map((c) => (
                    <li key={c.id} className="text-sm py-2 border-b last:border-0">
                      {formatCurrency(c.amount)} · {REFUND_APPLICATION_LABELS[c.appliedAs]} · {c.status} · {c.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoiceId={invoice.id}
        maxAmount={invoice.balance}
        currency={invoice.currency}
        onRecord={(payload) => recordPayment(invoice.id, payload)}
        recordedBy={currentUser?.id ?? ""}
      />
      <AdjustmentRequestDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        type="discount"
        invoiceId={invoice.id}
        invoiceNetAmount={invoice.netAmount}
        onCreate={(payload) =>
          createAdjustmentRequest({
            ...payload,
            type: "discount",
            invoiceId: payload.invoiceId,
            reason: payload.reason,
            discountScope: payload.discountScope,
            discountPercent: payload.discountPercent,
            discountAmount: payload.discountAmount,
            requestedBy: payload.requestedBy,
          })
        }
        requestedBy={currentUser?.id ?? ""}
      />
      <AdjustmentRequestDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        type="refund"
        invoiceId={invoice.id}
        invoiceNetAmount={invoice.netAmount}
        onCreate={(payload) =>
          createAdjustmentRequest({
            ...payload,
            type: "refund",
            invoiceId: payload.invoiceId,
            reason: payload.reason,
            refundAmount: payload.refundAmount,
            refundApplication: payload.refundApplication,
            requestedBy: payload.requestedBy,
          })
        }
        requestedBy={currentUser?.id ?? ""}
      />
    </div>
  );
}

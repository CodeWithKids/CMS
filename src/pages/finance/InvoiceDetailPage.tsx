import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { useTerms } from "@/hooks/useTerms";
import { useOrganisation } from "@/hooks/useOrganisation";
import { getLearner } from "@/mockData";
import { getOrganization } from "@/mockData";
import { formatCurrency } from "@/lib/financeUtils";
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, learnersGetById } from "@/lib/api";
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
import { ArrowLeft, FileText, DollarSign, List, CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { logAppEvent } from "@/lib/analytics";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { terms } = useTerms();
  const invoice = useInvoice(id);
  const payments = usePaymentsForInvoice(id);
  const adjustments = useAdjustmentsForInvoice(id);
  const creditNotes = useCreditNotesForInvoice(id);
  const { recordPayment, createAdjustmentRequest, loadPaymentsForInvoice } = useFinance();
  const apiEnabled = isApiEnabled();
  const { organisation: orgFromApi } = useOrganisation(
    invoice?.payerType === "organisation" ? invoice.payerId : null
  );
  const { data: learnerFromApi } = useQuery({
    queryKey: ["learner", invoice?.learnerId],
    queryFn: () => learnersGetById(invoice!.learnerId!),
    enabled: apiEnabled && !!invoice?.learnerId && invoice?.payerType === "parent",
  });
  const payerName =
    !invoice
      ? ""
      : invoice.payerType === "parent" && invoice.learnerId
        ? apiEnabled && learnerFromApi
          ? `${learnerFromApi.firstName} ${learnerFromApi.lastName}`
          : (() => {
              const learner = getLearner(invoice.learnerId);
              return learner ? `${learner.firstName} ${learner.lastName}` : invoice.learnerId;
            })()
        : apiEnabled && orgFromApi
          ? orgFromApi.name
          : getOrganization(invoice.payerId)?.name ?? invoice.payerId;

  useEffect(() => {
    if (id) loadPaymentsForInvoice(id);
  }, [id, loadPaymentsForInvoice]);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const termName = terms.find((t) => t.id === invoice.termId)?.name ?? invoice.termId;

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

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not update invoice</AlertTitle>
          <AlertDescription>
            Something went wrong while recording a payment or adjustment. Please try again.
          </AlertDescription>
        </Alert>
      )}

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
        onOpenChange={(open) => {
          setPaymentOpen(open);
        }}
        invoiceId={invoice.id}
        maxAmount={invoice.balance}
        currency={invoice.currency}
        onRecord={(payload) => {
          setHasError(false);
          try {
            recordPayment(invoice.id, payload);
            toast({
              title: "Payment recorded",
              description: `A payment of ${formatCurrency(payload.amount)} has been applied to this invoice.`,
            });
            logAppEvent("invoice_payment_recorded", {
              invoiceId: invoice.id,
              amount: payload.amount,
              method: payload.method,
              date: payload.date,
            });
            setPaymentOpen(false);
          } catch (e) {
            console.error(e);
            setHasError(true);
            toast({
              title: "Could not record payment",
              description: "Please try again. If this keeps happening, contact the CWK team.",
              variant: "destructive",
            });
          }
        }}
        recordedBy={currentUser?.id ?? ""}
      />
      <AdjustmentRequestDialog
        open={discountOpen}
        onOpenChange={(open) => {
          setDiscountOpen(open);
        }}
        type="discount"
        invoiceId={invoice.id}
        invoiceNetAmount={invoice.netAmount}
        onCreate={(payload) => {
          setHasError(false);
          try {
            createAdjustmentRequest({
              ...payload,
              type: "discount",
              invoiceId: payload.invoiceId,
              reason: payload.reason,
              discountScope: payload.discountScope,
              discountPercent: payload.discountPercent,
              discountAmount: payload.discountAmount,
              requestedBy: payload.requestedBy,
            });
            toast({
              title: "Discount request submitted",
              description: "Your request has been logged for review.",
            });
            logAppEvent("invoice_discount_requested", {
              invoiceId: invoice.id,
              discountAmount: payload.discountAmount,
              discountPercent: payload.discountPercent,
              scope: payload.discountScope,
            });
            setDiscountOpen(false);
          } catch (e) {
            console.error(e);
            setHasError(true);
            toast({
              title: "Could not submit discount request",
              description: "Please try again. If this keeps happening, contact the CWK team.",
              variant: "destructive",
            });
          }
        }}
        requestedBy={currentUser?.id ?? ""}
      />
      <AdjustmentRequestDialog
        open={refundOpen}
        onOpenChange={(open) => {
          setRefundOpen(open);
        }}
        type="refund"
        invoiceId={invoice.id}
        invoiceNetAmount={invoice.netAmount}
        onCreate={(payload) => {
          setHasError(false);
          try {
            createAdjustmentRequest({
              ...payload,
              type: "refund",
              invoiceId: payload.invoiceId,
              reason: payload.reason,
              refundAmount: payload.refundAmount,
              refundApplication: payload.refundApplication,
              requestedBy: payload.requestedBy,
            });
            toast({
              title: "Refund / credit request submitted",
              description: "Your request has been logged for review.",
            });
            logAppEvent("invoice_refund_requested", {
              invoiceId: invoice.id,
              refundAmount: payload.refundAmount,
              application: payload.refundApplication,
            });
            setRefundOpen(false);
          } catch (e) {
            console.error(e);
            setHasError(true);
            toast({
              title: "Could not submit refund request",
              description: "Please try again. If this keeps happening, contact the CWK team.",
              variant: "destructive",
            });
          }
        }}
        requestedBy={currentUser?.id ?? ""}
      />
    </div>
  );
}

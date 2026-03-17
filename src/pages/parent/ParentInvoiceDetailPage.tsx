import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import { useInvoice } from "@/context/FinanceContext";
import { isApiEnabled } from "@/lib/api";
import type { Receipt } from "@/types";
import { parentChildMap, getLearner, getReceiptForInvoice } from "@/mockData";
import { ArrowLeft, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptView } from "@/features/invoices/components/ReceiptView";
import { printInvoice, printReceipt } from "@/utils/printInvoice";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  partially_paid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export default function ParentInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const apiEnabled = isApiEnabled();
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];

  const { getInvoices } = useFinanceAccount();
  const legacyInvoice = id ? getInvoices().find((i) => i.id === id) : undefined;

  const apiInvoice = useInvoice(id);

  const invoice = apiEnabled ? apiInvoice : legacyInvoice;

  const allowed = useMemo(() => {
    if (!invoice) return false;
    if (invoice.learnerId == null) return false;
    return childIds.includes(invoice.learnerId);
  }, [invoice, childIds]);

  const learner =
    invoice?.learnerId != null ? getLearner(invoice.learnerId) : null;

  if (!id || !invoice || !allowed) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-8 max-w-md">
          <p className="font-medium text-muted-foreground">Invoice not found</p>
          <p className="text-sm text-muted-foreground mt-1">This invoice does not exist or you do not have access. Go back to your invoices.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/parent/invoices">Back to invoices</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pending =
    apiEnabled
      ? invoice.balance
      : invoice.status !== "paid" && invoice.status !== "draft"
        ? (invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0)
        : invoice.status === "draft"
          ? invoice.totalAmount
          : 0;

  const payerLabel = learner
    ? `${learner.firstName} ${learner.lastName}`
    : null;

  const receipt: Receipt | null = useMemo(() => {
    if (invoice.status !== "paid") return null;
    if (!apiEnabled) {
      return getReceiptForInvoice(
        invoice as any,
        payerLabel
      );
    }
    const amountPaid =
      typeof (invoice as any).amountPaid === "number"
        ? (invoice as any).amountPaid
        : (invoice as any).paidAmount ?? (invoice as any).totalAmount;
    const paidDate =
      (invoice as any).issueDate ??
      (invoice as any).dueDate ??
      new Date().toISOString();
    const invoiceNumber =
      (invoice as any).invoiceNumber ?? invoice.id;
    return {
      id: `receipt-${invoice.id}`,
      invoiceId: invoice.id,
      invoiceNumber,
      receiptNumber: `RCPT-${invoiceNumber}`,
      paidDate,
      amountPaid,
      description:
        (invoice as any).notes ??
        (invoice as any).description ??
        `${(invoice as any).term ?? (invoice as any).termId ?? ""} – ${
          (invoice as any).source ??
          (invoice as any).payerType ??
          "Invoice"
        }`,
      payerLabel,
      createdAt: paidDate,
    };
  }, [apiEnabled, invoice, payerLabel]);

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/parent/invoices")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to invoices
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="page-title">Invoice {invoice.invoiceNumber}</h1>
          <p className="page-subtitle">
            {learner ? `${learner.firstName} ${learner.lastName}` : "—"} · {invoice.term}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              printInvoice(
                apiEnabled
                  ? {
                      invoiceNumber:
                        (invoice as any).invoiceNumber ?? invoice.id,
                      term:
                        (invoice as any).term ??
                        (invoice as any).termId ??
                        "",
                      totalAmount:
                        (invoice as any).totalAmount ??
                        (invoice as any).netAmount ??
                        0,
                      status: invoice.status,
                      dueDate: invoice.dueDate,
                      paidAmount:
                        (invoice as any).paidAmount ??
                        (invoice as any).amountPaid ??
                        0,
                      paidDate:
                        (invoice as any).paidDate ??
                        (invoice as any).issueDate ??
                        (invoice as any).dueDate,
                      description:
                        (invoice as any).description ??
                        (invoice as any).notes ??
                        undefined,
                      source:
                        (invoice as any).source ??
                        (invoice as any).payerType,
                    }
                  : {
                      invoiceNumber: (invoice as any).invoiceNumber,
                      term: (invoice as any).term,
                      totalAmount: (invoice as any).totalAmount,
                      status: invoice.status,
                      dueDate: (invoice as any).dueDate,
                      paidAmount: (invoice as any).paidAmount,
                      paidDate: (invoice as any).paidDate,
                      description:
                        (invoice as any).description ?? undefined,
                      source: (invoice as any).source,
                    },
                {
                  subtitle: learner
                    ? `${learner.firstName} ${learner.lastName}`
                    : undefined,
                }
              )
            }
          >
            <Download className="w-4 h-4 mr-1" /> Download invoice
          </Button>
          {receipt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => printReceipt(receipt)}
            >
              <Download className="w-4 h-4 mr-1" /> Download receipt
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
            <span
              className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[invoice.status] ?? ""}`}
            >
              {invoice.status.replace("_", " ")}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Due date</p>
            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
          <p className="text-xl font-semibold">
            Ksh{" "}
            {(
              (invoice as any).totalAmount ??
              (invoice as any).netAmount ??
              0
            ).toLocaleString()}
          </p>
          {((invoice as any).paidAmount ??
            (invoice as any).amountPaid) != null &&
            ((invoice as any).paidAmount ??
              (invoice as any).amountPaid) >
              0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Paid: Ksh{" "}
              {(
                (invoice as any).paidAmount ??
                (invoice as any).amountPaid
              ).toLocaleString()}
              {(invoice as any).paidDate &&
                ` on ${formatDate((invoice as any).paidDate)}`}
            </p>
          )}
          {pending > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Outstanding: Ksh {pending.toLocaleString()}
            </p>
          )}
        </div>

        {invoice.description && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
            <p className="text-sm">{invoice.description}</p>
          </div>
        )}

        {/* Line items: legacy Invoice has no line items; show a single summary row if useful */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium">Item</th>
                <th className="text-right p-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">
                  {invoice.description ?? `${invoice.term} – ${invoice.source.replace("_", " ")}`}
                </td>
                <td className="p-2 text-right">Ksh {invoice.totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {invoice.status !== "paid" && invoice.status !== "draft" && pending > 0 && (
          <div className="pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => {}}
            >
              <CreditCard className="w-4 h-4" /> View payment options
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Payment integration (e.g. M-Pesa, card) can be added here.
            </p>
          </div>
        )}

        {invoice.status === "paid" && (() => {
          const payerLabel = learner ? `${learner.firstName} ${learner.lastName}` : null;
          const receipt = getReceiptForInvoice(invoice, payerLabel);
          return receipt ? (
            <div className="pt-4 border-t mt-4">
              <h3 className="font-semibold mb-3">Receipt</h3>
              <ReceiptView receipt={receipt} />
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

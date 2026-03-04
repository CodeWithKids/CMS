import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
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
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];

  const { getInvoices } = useFinanceAccount();
  const invoice = id ? getInvoices().find((i) => i.id === id) : undefined;
  const allowed =
    invoice?.learnerId != null && childIds.includes(invoice.learnerId);
  const learner = invoice?.learnerId != null ? getLearner(invoice.learnerId) : null;

  if (!id || !invoice || !allowed) {
    return (
      <div className="page-container">
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

  const pending = invoice.status !== "paid" && invoice.status !== "draft"
    ? (invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0)
    : invoice.status === "draft"
      ? invoice.totalAmount
      : 0;

  return (
    <div className="page-container">
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
                {
                  invoiceNumber: invoice.invoiceNumber,
                  term: invoice.term,
                  totalAmount: invoice.totalAmount,
                  status: invoice.status,
                  dueDate: invoice.dueDate,
                  paidAmount: invoice.paidAmount,
                  paidDate: invoice.paidDate,
                  description: invoice.description ?? undefined,
                  source: invoice.source,
                },
                { subtitle: learner ? `${learner.firstName} ${learner.lastName}` : undefined }
              )
            }
          >
            <Download className="w-4 h-4 mr-1" /> Download invoice
          </Button>
          {invoice.status === "paid" && (() => {
            const payerLabel = learner ? `${learner.firstName} ${learner.lastName}` : null;
            const receipt = getReceiptForInvoice(invoice, payerLabel);
            return receipt ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => printReceipt(receipt)}
              >
                <Download className="w-4 h-4 mr-1" /> Download receipt
              </Button>
            ) : null;
          })()}
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
          <p className="text-xl font-semibold">Ksh {invoice.totalAmount.toLocaleString()}</p>
          {invoice.paidAmount != null && invoice.paidAmount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Paid: Ksh {invoice.paidAmount.toLocaleString()}
              {invoice.paidDate && ` on ${formatDate(invoice.paidDate)}`}
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

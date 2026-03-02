import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { getFinanceAccountInvoices, getReceiptForInvoice } from "@/mockData";
import { ArrowLeft } from "lucide-react";
import { ReceiptView } from "@/features/invoices/components/ReceiptView";
import { Card, CardContent } from "@/components/ui/card";

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

export default function OrganisationInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organisation, organizationId, isOrgUser } = useOrganisationLearners();

  const invoice = id
    ? getFinanceAccountInvoices().find((i) => i.id === id)
    : undefined;
  const allowed =
    isOrgUser &&
    organisation &&
    invoice?.organizationId != null &&
    invoice.organizationId === organizationId;

  if (!isOrgUser || !organisation) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Organisation not found. Please contact support.</p>
      </div>
    );
  }

  if (!id || !invoice || !allowed) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Invoice not found or you don’t have access to it.</p>
        <Link to="/organisation/invoices" className="text-primary hover:underline mt-2 inline-block">
          Back to Invoices & receipts
        </Link>
      </div>
    );
  }

  const pending =
    invoice.status !== "paid" && invoice.status !== "draft"
      ? (invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0)
      : 0;
  const receipt =
    invoice.status === "paid"
      ? getReceiptForInvoice(invoice, organisation.name)
      : null;

  return (
    <div className="page-container">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/organisation/invoices")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices & receipts
        </button>
      </div>

      <h1 className="page-title">Invoice {invoice.invoiceNumber}</h1>
      <p className="page-subtitle">{organisation.name} · {invoice.term}</p>

      <Card className="max-w-2xl">
        <CardContent className="pt-6 space-y-4">
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

          {receipt && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Receipt</h3>
              <ReceiptView receipt={receipt} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

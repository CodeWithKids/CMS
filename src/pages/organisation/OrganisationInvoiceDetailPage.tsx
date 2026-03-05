import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import { useInvoice } from "@/context/FinanceContext";
import { isApiEnabled } from "@/lib/api";
import type { Receipt } from "@/types";
import { getReceiptForInvoice } from "@/mockData";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptView } from "@/features/invoices/components/ReceiptView";
import { Card, CardContent } from "@/components/ui/card";
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

export default function OrganisationInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organisation, organizationId, isOrgUser } = useOrganisationLearners();

  const { getInvoices } = useFinanceAccount();
  const legacyInvoice = id ? getInvoices().find((i) => i.id === id) : undefined;

  const apiEnabled = isApiEnabled();
  const apiInvoice = useInvoice(id);

  const invoice = apiEnabled ? apiInvoice : legacyInvoice;

  const allowed = useMemo(() => {
    if (!invoice) return false;
    const orgId =
      (invoice as any).organizationId ?? (invoice as any).organisationId;
    return (
      isOrgUser &&
      !!organisation &&
      orgId != null &&
      orgId === organizationId
    );
  }, [invoice, isOrgUser, organisation, organizationId]);

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
    apiEnabled
      ? invoice.balance
      : invoice.status !== "paid" && invoice.status !== "draft"
        ? (invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0)
        : 0;

  const receipt: Receipt | null = useMemo(() => {
    if (invoice.status !== "paid") return null;
    if (!apiEnabled) {
      return getReceiptForInvoice(invoice as any, organisation.name);
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
      payerLabel: organisation.name,
      createdAt: paidDate,
    };
  }, [apiEnabled, invoice, organisation.name]);

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

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="page-title">Invoice {invoice.invoiceNumber}</h1>
          <p className="page-subtitle">{organisation.name} · {invoice.term}</p>
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
                { subtitle: organisation.name }
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

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import { useInvoices } from "@/context/FinanceContext";
import { isApiEnabled } from "@/lib/api";
import { getInvoicesForOrganisation } from "@/mockData";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  partially_paid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
};

export default function OrganisationInvoicesPage() {
  const { organisation, organizationId, isOrgUser } = useOrganisationLearners();
  const { getInvoices } = useFinanceAccount();
  const financeInvoices = useInvoices({ payerType: "organisation" });
  const apiEnabled = isApiEnabled();

  const legacyInvoices = organizationId
    ? getInvoicesForOrganisation(getInvoices(), organizationId)
    : [];

  const apiInvoices = useMemo(
    () =>
      financeInvoices.filter(
        (inv) =>
          inv.organisationId != null &&
          organizationId != null &&
          inv.organisationId === organizationId
      ),
    [financeInvoices, organizationId]
  );

  const invoices = apiEnabled ? apiInvoices : legacyInvoices;

  const [loadError, setLoadError] = useState(false);

  if (!isOrgUser || !organisation) {
    return (
      <div className="page-container">
        <div className="rounded-xl border bg-card p-8 max-w-md">
          <p className="font-medium text-muted-foreground">Organisation not found</p>
          <p className="text-sm text-muted-foreground mt-1">Please contact Code With Kids support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Invoices & receipts</h1>
      <p className="page-subtitle">
        View invoices issued to {organisation.name}. Open an invoice to see details or download a receipt when paid.
      </p>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load invoices.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setLoadError(false)}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-medium text-muted-foreground">No invoices yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices for your organisation will appear here when they are issued.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Term</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-medium">
                    <Link
                      to={`/organisation/invoices/${inv.id}`}
                      className="text-primary hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td>{inv.term}</td>
                  <td>{inv.description ?? "—"}</td>
                  <td>Ksh {inv.totalAmount.toLocaleString()}</td>
                  <td>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[inv.status] ?? ""}`}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {inv.status === "paid" ? (
                      <Link
                        to={`/organisation/invoices/${inv.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View receipt
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

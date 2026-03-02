import { Link } from "react-router-dom";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { getInvoicesForOrganisation } from "@/mockData";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  partially_paid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
};

export default function OrganisationInvoicesPage() {
  const { organisation, organizationId, isOrgUser } = useOrganisationLearners();
  const invoices = organizationId ? getInvoicesForOrganisation(organizationId) : [];

  if (!isOrgUser || !organisation) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Organisation not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Invoices & receipts</h1>
      <p className="page-subtitle">
        View invoices issued to {organisation.name} and download receipts for paid invoices
      </p>

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

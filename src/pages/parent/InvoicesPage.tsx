import { useState } from "react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import { useInvoices } from "@/context/FinanceContext";
import { isApiEnabled } from "@/lib/api";
import { parentChildMap, getInvoicesForParent, getLearner } from "@/mockData";
import { FileText } from "lucide-react";
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

export default function InvoicesPage() {
  const { currentUser } = useAuth();
  const { getInvoices } = useFinanceAccount();
   // Finance invoices (API-backed when VITE_API_URL is set)
  const financeInvoices = useInvoices({ payerType: "parent" });
  const apiEnabled = isApiEnabled();
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];
  const legacyInvoices = getInvoicesForParent(getInvoices(), childIds);
  const apiInvoices = useMemo(
    () =>
      financeInvoices.filter(
        (inv) => inv.learnerId != null && childIds.includes(inv.learnerId)
      ),
    [financeInvoices, childIds]
  );
  const invoices = apiEnabled ? apiInvoices : legacyInvoices;
  const [loadError, setLoadError] = useState(false);

  return (
    <div className="page-container">
      <h1 className="page-title">Invoices</h1>
      <p className="page-subtitle">View payment history and outstanding invoices. Open an invoice to see details or pay.</p>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load your invoices.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setLoadError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {invoices.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No invoices yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices for your children will appear here when they are issued. If your organisation pays directly, you may not see any.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Child</th>
                <th>Term</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const learner = inv.learnerId != null ? getLearner(inv.learnerId) : null;
                return (
                  <tr key={inv.id}>
                    <td className="font-medium">
                      <Link to={`/parent/invoices/${inv.id}`} className="text-primary hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{learner ? `${learner.firstName} ${learner.lastName}` : "—"}</td>
                    <td>{inv.term}</td>
                    <td>Ksh {inv.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[inv.status] ?? ""}`}>
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      {inv.status === "paid" ? (
                        <Link to={`/parent/invoices/${inv.id}`} className="text-primary hover:underline text-sm">
                          View receipt
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

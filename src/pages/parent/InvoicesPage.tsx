import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { parentChildMap, getInvoicesForParent, getLearner } from "@/mockData";
import { FileText } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  partially_paid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
};

export default function InvoicesPage() {
  const { currentUser } = useAuth();
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];
  const invoices = getInvoicesForParent(childIds);

  return (
    <div className="page-container">
      <h1 className="page-title">Invoices</h1>
      <p className="page-subtitle">View payment history and outstanding invoices</p>

      {invoices.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No invoices yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices for your children will appear here when they are issued.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Child</th>
              <th>Term</th>
              <th>Amount</th>
              <th>Status</th>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

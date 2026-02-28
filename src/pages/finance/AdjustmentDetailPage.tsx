import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { canApproveAdjustment } from "@/features/finance/lib/permissions";
import { getLearner } from "@/mockData";
import { getOrganization } from "@/mockData";
import { mockTerms } from "@/mockData";
import { formatCurrency } from "@/lib/financeUtils";
import {
  ADJUSTMENT_TYPE_LABELS,
  ADJUSTMENT_STATUS_LABELS,
  DISCOUNT_SCOPE_LABELS,
  REFUND_APPLICATION_LABELS,
} from "@/types/finance";
import type { AdjustmentRequest } from "@/types/finance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

function getPayerName(inv: { payerType: string; payerId: string; learnerId?: string }): string {
  if (inv.payerType === "parent" && inv.learnerId) {
    const learner = getLearner(inv.learnerId);
    return learner ? `${learner.firstName} ${learner.lastName}` : inv.learnerId;
  }
  const org = getOrganization(inv.payerId);
  return org?.name ?? inv.payerId;
}

export default function AdjustmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getInvoice, updateAdjustmentStatus, adjustmentRequests } = useFinance();

  const [rejectNote, setRejectNote] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const request = adjustmentRequests.find((r) => r.id === id);
  const invoice = request ? getInvoice(request.invoiceId) : undefined;

  const canApprove = canApproveAdjustment(currentUser);

  if (!request) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Adjustment request not found.</p>
        <Link to="/finance/adjustments" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to adjustments
        </Link>
      </div>
    );
  }

  const isPending = request.status === "pending";

  const handleApprove = () => {
    updateAdjustmentStatus(request.id, "approved", { approvedBy: currentUser?.id });
    setApproveOpen(false);
  };

  const handleReject = () => {
    updateAdjustmentStatus(request.id, "rejected", {
      rejectedBy: currentUser?.id,
      decisionNote: rejectNote.trim() || undefined,
    });
    setRejectOpen(false);
    setRejectNote("");
  };

  return (
    <div className="p-6 space-y-6">
      <Link
        to="/finance/adjustments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to adjustments
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            {ADJUSTMENT_TYPE_LABELS[request.type]} request · {request.id}
          </CardTitle>
          <CardDescription>
            Status: {ADJUSTMENT_STATUS_LABELS[request.status as keyof typeof ADJUSTMENT_STATUS_LABELS]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground mb-2">Invoice summary</p>
              <p className="text-sm">
                Invoice {invoice.id} · Payer: {getPayerName(invoice)} · Term:{" "}
                {mockTerms.find((t) => t.id === invoice.termId)?.name ?? invoice.termId}
              </p>
              <p className="text-sm mt-1">
                Gross: {formatCurrency(invoice.grossAmount)} · Net: {formatCurrency(invoice.netAmount)} · Paid:{" "}
                {formatCurrency(invoice.amountPaid)} · Balance: {formatCurrency(invoice.balance)}
              </p>
              <Link
                to={`/finance/invoices/${invoice.id}`}
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View invoice →
              </Link>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Request details</p>
            <ul className="text-sm space-y-1">
              <li>Type: {ADJUSTMENT_TYPE_LABELS[request.type]}</li>
              {request.type === "discount" && request.discountScope && (
                <li>Scope: {DISCOUNT_SCOPE_LABELS[request.discountScope]}</li>
              )}
              {request.type === "discount" && (
                <li>
                  Amount:{" "}
                  {request.discountAmount != null
                    ? formatCurrency(request.discountAmount)
                    : request.discountPercent != null
                      ? `${request.discountPercent}%`
                      : "—"}
                </li>
              )}
              {request.type === "refund" && (
                <>
                  <li>Refund amount: {request.refundAmount != null ? formatCurrency(request.refundAmount) : "—"}</li>
                  {request.refundApplication && (
                    <li>Apply as: {REFUND_APPLICATION_LABELS[request.refundApplication]}</li>
                  )}
                </>
              )}
              <li>Reason: {request.reason}</li>
              <li>Requested by: {request.requestedBy}</li>
              <li>Requested at: {new Date(request.requestedAt).toLocaleString()}</li>
            </ul>
          </div>

          {isPending && canApprove && (
            <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={() => setApproveOpen(true)}>
                <CheckCircle className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve request</AlertDialogTitle>
            <AlertDialogDescription>
              This will apply the {request.type === "discount" ? "discount" : "refund/credit"} to the invoice
              and mark the request as approved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject request</AlertDialogTitle>
            <AlertDialogDescription>
              The request will be marked as rejected. You can add a note for the requester (optional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Decision note (optional)</Label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Reason for rejection"
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReject}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

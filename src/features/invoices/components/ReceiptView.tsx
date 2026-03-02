import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Receipt } from "@/types";
import { Receipt as ReceiptIcon } from "lucide-react";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

interface ReceiptViewProps {
  receipt: Receipt;
  /** Optional: e.g. "Code With Kids" */
  issuerName?: string;
  className?: string;
}

/** Displays a payment receipt. Used on parent and organisation invoice detail pages when invoice is paid. */
export function ReceiptView({ receipt, issuerName = "Code With Kids", className }: ReceiptViewProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ReceiptIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Payment receipt</h3>
            <p className="text-sm text-muted-foreground">{receipt.receiptNumber}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Issued by</p>
            <p className="font-medium">{issuerName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date paid</p>
            <p className="font-medium">{formatDate(receipt.paidDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Invoice</p>
            <p className="font-medium">{receipt.invoiceNumber}</p>
          </div>
          {receipt.payerLabel && (
            <div>
              <p className="text-muted-foreground">Paid by</p>
              <p className="font-medium">{receipt.payerLabel}</p>
            </div>
          )}
        </div>
        {receipt.description && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
            <p className="text-sm mt-0.5">{receipt.description}</p>
          </div>
        )}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount paid</p>
          <p className="text-xl font-semibold mt-0.5">Ksh {receipt.amountPaid.toLocaleString()}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Thank you for your payment. Keep this receipt for your records.
        </p>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdjustmentType, DiscountScope, RefundApplication } from "@/types/finance";
import {
  DISCOUNT_SCOPE_LABELS,
  REFUND_APPLICATION_LABELS,
} from "@/types/finance";

const DISCOUNT_TYPES = [
  "Scholarship",
  "Sibling",
  "Hardship",
  "Partner",
  "Correction",
] as const;

const REFUND_TYPES = [
  "Dropout",
  "Overpayment",
  "Error",
  "Cancellation",
] as const;

interface AdjustmentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: AdjustmentType;
  invoiceId: string;
  invoiceNetAmount: number;
  onCreate: (payload: {
    type: AdjustmentType;
    invoiceId: string;
    reason: string;
    discountScope?: DiscountScope;
    discountPercent?: number;
    discountAmount?: number;
    refundAmount?: number;
    refundApplication?: RefundApplication;
    requestedBy: string;
  }) => void;
  requestedBy: string;
}

export function AdjustmentRequestDialog({
  open,
  onOpenChange,
  type,
  invoiceId,
  invoiceNetAmount,
  onCreate,
  requestedBy,
}: AdjustmentRequestDialogProps) {
  const [reasonType, setReasonType] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [discountScope, setDiscountScope] = useState<DiscountScope>("this_invoice");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundApplication, setRefundApplication] = useState<RefundApplication>("credit_for_future");

  const reason = [reasonType, reasonText].filter(Boolean).join(" – ") || reasonText || reasonType || "No reason given.";

  const handleSubmit = () => {
    if (type === "discount") {
      const amount = discountAmount ? Number(discountAmount) : undefined;
      const percent = discountPercent ? Number(discountPercent) : undefined;
      if (!amount && !percent) return;
      onCreate({
        type: "discount",
        invoiceId,
        reason,
        discountScope,
        discountPercent: percent,
        discountAmount: amount,
        requestedBy,
      });
    } else {
      const amount = Number(refundAmount) || 0;
      if (amount <= 0 || amount > invoiceNetAmount) return;
      onCreate({
        type: "refund",
        invoiceId,
        reason,
        refundAmount: amount,
        refundApplication,
        requestedBy,
      });
    }
    setReasonType("");
    setReasonText("");
    setDiscountPercent("");
    setDiscountAmount("");
    setRefundAmount("");
    onOpenChange(false);
  };

  const discountAmountNum = Number(discountAmount) || 0;
  const discountPercentNum = Number(discountPercent) || 0;
  const refundAmountNum = Number(refundAmount) || 0;
  const discountValid =
    type !== "discount" ||
    (reason.trim().length > 0 && (discountAmountNum > 0 || (discountPercentNum > 0 && discountPercentNum <= 100)));
  const refundValid =
    type !== "refund" || (reason.trim().length > 0 && refundAmountNum > 0 && refundAmountNum <= invoiceNetAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "discount" ? "Request discount" : "Request refund / credit"}</DialogTitle>
          <DialogDescription>
            {type === "discount"
              ? "Submit a discount request for approval. Scope and amount or percentage required."
              : "Submit a refund or credit request. Amount and how to apply (refund to payer or credit for future) required."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Type</Label>
            <Select
              value={reasonType}
              onValueChange={setReasonType}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {type === "discount"
                  ? DISCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))
                  : REFUND_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Additional details"
              className="mt-1"
              rows={2}
            />
          </div>

          {type === "discount" && (
            <>
              <div>
                <Label>Scope</Label>
                <Select value={discountScope} onValueChange={(v) => setDiscountScope(v as DiscountScope)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DISCOUNT_SCOPE_LABELS) as DiscountScope[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {DISCOUNT_SCOPE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount amount (optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Discount % (optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {type === "refund" && (
            <>
              <div>
                <Label>Amount (max {invoiceNetAmount})</Label>
                <Input
                  type="number"
                  min={1}
                  max={invoiceNetAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Apply as</Label>
                <Select value={refundApplication} onValueChange={(v) => setRefundApplication(v as RefundApplication)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REFUND_APPLICATION_LABELS) as RefundApplication[]).map((a) => (
                      <SelectItem key={a} value={a}>
                        {REFUND_APPLICATION_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={type === "discount" ? !discountValid : !refundValid}
          >
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

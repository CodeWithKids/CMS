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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHOD_LABELS } from "@/types/finance";
import type { PaymentMethod } from "@/types/finance";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  maxAmount: number;
  currency: string;
  onRecord: (payload: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    date: string;
    recordedBy: string;
  }) => void;
  recordedBy: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  maxAmount,
  currency,
  onRecord,
  recordedBy,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const numAmount = Number(amount) || 0;
  const valid = numAmount > 0 && numAmount <= maxAmount && date;

  const handleSubmit = () => {
    if (!valid) return;
    onRecord({
      amount: numAmount,
      method,
      reference: reference.trim() || undefined,
      date,
      recordedBy,
    });
    setAmount("");
    setReference("");
    setDate(new Date().toISOString().split("T")[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record a payment for this invoice. Maximum {currency} {maxAmount.toLocaleString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Amount ({currency})</Label>
            <Input
              type="number"
              min={1}
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reference (optional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. MPESA code, bank ref"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!valid}>
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

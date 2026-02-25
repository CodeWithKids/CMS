import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  FinanceInvoice,
  Payment,
  AdjustmentRequest,
  CreditNote,
  AdjustmentStatus,
  RefundApplication,
} from "@/types/finance";
import {
  mockFinanceInvoices,
  mockFinancePayments,
  mockAdjustmentRequests,
  mockCreditNotes,
  DEFAULT_FINANCE_CURRENCY,
} from "@/features/finance/data/mockFinance";

const today = new Date().toISOString().split("T")[0];

function deriveInvoiceStatus(inv: FinanceInvoice): FinanceInvoice["status"] {
  if (inv.status === "cancelled" || inv.status === "paid") return inv.status;
  if (inv.balance <= 0) return "paid";
  if (inv.dueDate < today && inv.balance > 0) return "overdue";
  if (inv.amountPaid > 0) return "partially_paid";
  if (inv.status === "draft") return "draft";
  return inv.status;
}

function nextPaymentId(payments: Payment[]): string {
  const n = payments
    .map((p) => p.id.replace("pay-", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  return `pay-${(n.length ? Math.max(...n) : 0) + 1}`;
}

function nextAdjustmentId(adj: AdjustmentRequest[]): string {
  const n = adj
    .map((a) => a.id.replace("adj-", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  return `adj-${(n.length ? Math.max(...n) : 0) + 1}`;
}

function nextCreditNoteId(notes: CreditNote[]): string {
  const n = notes
    .map((c) => c.id.replace("cn-", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  return `cn-${(n.length ? Math.max(...n) : 0) + 1}`;
}

interface FinanceContextType {
  invoices: FinanceInvoice[];
  payments: Payment[];
  adjustmentRequests: AdjustmentRequest[];
  creditNotes: CreditNote[];

  getInvoice: (id: string) => FinanceInvoice | undefined;
  getInvoices: (filters?: { termId?: string; status?: string; payerType?: string }) => FinanceInvoice[];
  recordPayment: (invoiceId: string, payload: { amount: number; method: Payment["method"]; reference?: string; date: string; recordedBy: string }) => void;
  createAdjustmentRequest: (payload: Omit<AdjustmentRequest, "id" | "status" | "requestedAt"> & { requestedBy: string }) => void;
  updateAdjustmentStatus: (adjustmentId: string, status: "approved" | "rejected", opts: { approvedBy?: string; rejectedBy?: string; decisionNote?: string }) => void;
  createInvoice: (payload: Omit<FinanceInvoice, "id" | "createdAt" | "createdBy"> & { createdBy: string }) => void;
  updateInvoiceStatus: (invoiceId: string, status: FinanceInvoice["status"]) => void;

  getPaymentsForInvoice: (invoiceId: string) => Payment[];
  getAdjustmentsForInvoice: (invoiceId: string) => AdjustmentRequest[];
  getPendingAdjustments: () => AdjustmentRequest[];
  getCreditNotesForInvoice: (invoiceId: string) => CreditNote[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<FinanceInvoice[]>(() => [...mockFinanceInvoices]);
  const [payments, setPayments] = useState<Payment[]>(() => [...mockFinancePayments]);
  const [adjustmentRequests, setAdjustmentRequests] = useState<AdjustmentRequest[]>(() => [...mockAdjustmentRequests]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => [...mockCreditNotes]);

  const getInvoice = useCallback(
    (id: string) => {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return undefined;
      const status = deriveInvoiceStatus(inv);
      return { ...inv, status };
    },
    [invoices]
  );

  const getInvoices = useCallback(
    (filters?: { termId?: string; status?: string; payerType?: string }) => {
      let list = invoices.map((inv) => ({ ...inv, status: deriveInvoiceStatus(inv) }));
      if (filters?.termId) list = list.filter((i) => i.termId === filters.termId);
      if (filters?.status) list = list.filter((i) => deriveInvoiceStatus(i) === filters.status);
      if (filters?.payerType) list = list.filter((i) => i.payerType === filters.payerType);
      return list;
    },
    [invoices]
  );

  const recordPayment = useCallback(
    (invoiceId: string, payload: { amount: number; method: Payment["method"]; reference?: string; date: string; recordedBy: string }) => {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (!inv) return;
      const newPayment: Payment = {
        id: nextPaymentId(payments),
        invoiceId,
        amount: payload.amount,
        method: payload.method,
        reference: payload.reference,
        date: payload.date,
        recordedBy: payload.recordedBy,
        createdAt: new Date().toISOString(),
      };
      setPayments((prev) => [...prev, newPayment]);
      const newPaid = inv.amountPaid + payload.amount;
      const newBalance = Math.max(0, inv.netAmount - newPaid);
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoiceId
            ? {
                ...i,
                amountPaid: newPaid,
                balance: newBalance,
                status: newBalance <= 0 ? "paid" : "partially_paid",
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
    },
    [invoices, payments]
  );

  const createAdjustmentRequest = useCallback(
    (payload: Omit<AdjustmentRequest, "id" | "status" | "requestedAt"> & { requestedBy: string }) => {
      const newReq: AdjustmentRequest = {
        ...payload,
        id: nextAdjustmentId(adjustmentRequests),
        status: "pending",
        requestedAt: new Date().toISOString(),
      };
      setAdjustmentRequests((prev) => [...prev, newReq]);
    },
    [adjustmentRequests]
  );

  const updateAdjustmentStatus = useCallback(
    (adjustmentId: string, status: "approved" | "rejected", opts: { approvedBy?: string; rejectedBy?: string; decisionNote?: string }) => {
      const req = adjustmentRequests.find((r) => r.id === adjustmentId);
      if (!req) return;
      const now = new Date().toISOString();

      if (status === "rejected") {
        setAdjustmentRequests((prev) =>
          prev.map((r) =>
            r.id === adjustmentId
              ? {
                  ...r,
                  status: "rejected",
                  rejectedBy: opts.rejectedBy,
                  rejectedAt: now,
                  decisionNote: opts.decisionNote,
                }
              : r
          )
        );
        return;
      }

      if (status === "approved") {
        const inv = invoices.find((i) => i.id === req.invoiceId);
        if (req.type === "discount" && inv) {
          const discountAmount = req.discountAmount ?? (req.discountPercent != null ? Math.round((inv.grossAmount * req.discountPercent) / 100) : 0);
          const newNet = inv.grossAmount - inv.discountAmount - discountAmount;
          const newBalance = Math.max(0, newNet - inv.amountPaid);
          setInvoices((prev) =>
            prev.map((i) =>
              i.id === req.invoiceId
                ? {
                    ...i,
                    discountAmount: i.discountAmount + discountAmount,
                    netAmount: newNet,
                    balance: newBalance,
                    updatedAt: now,
                  }
                : i
            )
          );
        }
        if (req.type === "refund" && inv && req.refundAmount != null) {
          const newNote: CreditNote = {
            id: nextCreditNoteId(creditNotes),
            invoiceId: inv.id,
            amount: req.refundAmount,
            reason: req.reason,
            appliedAs: (req.refundApplication as RefundApplication) ?? "credit_for_future",
            status: req.refundApplication === "refund_to_payer" ? "created" : "applied_to_future",
            requestedBy: req.requestedBy,
            requestedAt: req.requestedAt,
            approvedBy: opts.approvedBy ?? "",
            approvedAt: now,
          };
          setCreditNotes((prev) => [...prev, newNote]);
          const newBalance = Math.max(0, inv.balance - req.refundAmount);
          setInvoices((prev) =>
            prev.map((i) =>
              i.id === req.invoiceId ? { ...i, balance: newBalance, updatedAt: now } : i
            )
          );
        }
        setAdjustmentRequests((prev) =>
          prev.map((r) =>
            r.id === adjustmentId
              ? { ...r, status: "approved" as AdjustmentStatus, approvedBy: opts.approvedBy, approvedAt: now, decisionNote: opts.decisionNote }
              : r
          )
        );
      }
    },
    [adjustmentRequests, invoices, creditNotes]
  );

  const createInvoice = useCallback(
    (payload: Omit<FinanceInvoice, "id" | "createdAt" | "createdBy"> & { createdBy: string }) => {
      const id = `fin-inv-${Date.now()}`;
      const inv: FinanceInvoice = {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
        createdBy: payload.createdBy,
      };
      setInvoices((prev) => [inv, ...prev]);
    },
    []
  );

  const updateInvoiceStatus = useCallback((invoiceId: string, status: FinanceInvoice["status"]) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status, updatedAt: new Date().toISOString() } : i))
    );
  }, []);

  const getPaymentsForInvoice = useCallback(
    (invoiceId: string) => payments.filter((p) => p.invoiceId === invoiceId).sort((a, b) => b.date.localeCompare(a.date)),
    [payments]
  );

  const getAdjustmentsForInvoice = useCallback(
    (invoiceId: string) =>
      adjustmentRequests.filter((r) => r.invoiceId === invoiceId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [adjustmentRequests]
  );

  const getPendingAdjustments = useCallback(
    () => adjustmentRequests.filter((r) => r.status === "pending"),
    [adjustmentRequests]
  );

  const getCreditNotesForInvoice = useCallback(
    (invoiceId: string) => creditNotes.filter((c) => c.invoiceId === invoiceId),
    [creditNotes]
  );

  const value = useMemo(
    () => ({
      invoices,
      payments,
      adjustmentRequests,
      creditNotes,
      getInvoice,
      getInvoices,
      recordPayment,
      createAdjustmentRequest,
      updateAdjustmentStatus,
      createInvoice,
      updateInvoiceStatus,
      getPaymentsForInvoice,
      getAdjustmentsForInvoice,
      getPendingAdjustments,
      getCreditNotesForInvoice,
    }),
    [
      invoices,
      payments,
      adjustmentRequests,
      creditNotes,
      getInvoice,
      getInvoices,
      recordPayment,
      createAdjustmentRequest,
      updateAdjustmentStatus,
      createInvoice,
      updateInvoiceStatus,
      getPaymentsForInvoice,
      getAdjustmentsForInvoice,
      getPendingAdjustments,
      getCreditNotesForInvoice,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}

export function useInvoices(filters?: { termId?: string; status?: string; payerType?: string }) {
  const { getInvoices } = useFinance();
  return useMemo(() => getInvoices(filters), [getInvoices, filters?.termId, filters?.status, filters?.payerType]);
}

export function useInvoice(id: string | undefined) {
  const { getInvoice } = useFinance();
  return useMemo(() => (id ? getInvoice(id) : undefined), [getInvoice, id]);
}

export function usePaymentsForInvoice(invoiceId: string | undefined) {
  const { getPaymentsForInvoice } = useFinance();
  return useMemo(() => (invoiceId ? getPaymentsForInvoice(invoiceId) : []), [getPaymentsForInvoice, invoiceId]);
}

export function useAdjustmentsForInvoice(invoiceId: string | undefined) {
  const { getAdjustmentsForInvoice } = useFinance();
  return useMemo(() => (invoiceId ? getAdjustmentsForInvoice(invoiceId) : []), [getAdjustmentsForInvoice, invoiceId]);
}

export function usePendingAdjustments() {
  const { getPendingAdjustments } = useFinance();
  return useMemo(() => getPendingAdjustments(), [getPendingAdjustments]);
}

export function useCreditNotesForInvoice(invoiceId: string | undefined) {
  const { getCreditNotesForInvoice } = useFinance();
  return useMemo(() => (invoiceId ? getCreditNotesForInvoice(invoiceId) : []), [getCreditNotesForInvoice, invoiceId]);
}

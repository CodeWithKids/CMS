import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
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
import {
  isApiEnabled,
  getAccessToken,
  financeGetInvoices,
  financeGetPayments,
  financeRecordPayment as apiRecordPayment,
} from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

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
  /** When using API: call to load payments for an invoice (e.g. from invoice detail page). */
  loadPaymentsForInvoice: (invoiceId: string) => Promise<void>;
  getAdjustmentsForInvoice: (invoiceId: string) => AdjustmentRequest[];
  getPendingAdjustments: () => AdjustmentRequest[];
  getCreditNotesForInvoice: (invoiceId: string) => CreditNote[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

function apiInvoiceToFinanceInvoice(inv: import("@/lib/api").FinanceInvoiceApi): FinanceInvoice {
  return {
    id: inv.id,
    payerType: inv.payerType as FinanceInvoice["payerType"],
    payerId: inv.payerId,
    learnerId: inv.learnerId,
    organisationId: inv.organisationId,
    termId: inv.termId,
    programmeId: inv.programmeId,
    trackId: inv.trackId,
    grossAmount: inv.grossAmount,
    discountAmount: inv.discountAmount,
    netAmount: inv.netAmount,
    amountPaid: inv.amountPaid,
    balance: inv.balance,
    currency: inv.currency,
    dueDate: inv.dueDate,
    issueDate: inv.issueDate,
    status: inv.status as FinanceInvoice["status"],
    notes: inv.notes,
    createdAt: inv.createdAt,
    createdBy: inv.createdBy,
    updatedAt: inv.updatedAt ?? undefined,
    updatedBy: inv.updatedBy ?? undefined,
  };
}

type SupabaseFinanceInvoiceRow = {
  id: string;
  payer_type?: string | null;
  payerType?: string | null;
  payer_id?: string | null;
  payerId?: string | null;
  learner_id?: string | null;
  learnerId?: string | null;
  organisation_id?: string | null;
  organisationId?: string | null;
  term_id?: string | null;
  termId?: string | null;
  programme_id?: string | null;
  programmeId?: string | null;
  track_id?: string | null;
  trackId?: string | null;
  gross_amount?: number | null;
  grossAmount?: number | null;
  discount_amount?: number | null;
  discountAmount?: number | null;
  net_amount?: number | null;
  netAmount?: number | null;
  amount_paid?: number | null;
  amountPaid?: number | null;
  balance?: number | null;
  currency?: string | null;
  due_date?: string | null;
  dueDate?: string | null;
  issue_date?: string | null;
  issueDate?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  created_by?: string | null;
  createdBy?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  updated_by?: string | null;
  updatedBy?: string | null;
};

function supabaseInvoiceToFinanceInvoice(inv: SupabaseFinanceInvoiceRow): FinanceInvoice {
  return {
    id: inv.id,
    payerType: ((inv.payer_type ?? inv.payerType ?? "parent") as FinanceInvoice["payerType"]),
    payerId: String(inv.payer_id ?? inv.payerId ?? ""),
    learnerId: (inv.learner_id ?? inv.learnerId ?? undefined) as string | undefined,
    organisationId: (inv.organisation_id ?? inv.organisationId ?? undefined) as string | undefined,
    termId: String(inv.term_id ?? inv.termId ?? ""),
    programmeId: (inv.programme_id ?? inv.programmeId ?? undefined) as string | undefined,
    trackId: (inv.track_id ?? inv.trackId ?? undefined) as string | undefined,
    grossAmount: Number(inv.gross_amount ?? inv.grossAmount ?? 0),
    discountAmount: Number(inv.discount_amount ?? inv.discountAmount ?? 0),
    netAmount: Number(inv.net_amount ?? inv.netAmount ?? 0),
    amountPaid: Number(inv.amount_paid ?? inv.amountPaid ?? 0),
    balance: Number(inv.balance ?? 0),
    currency: String(inv.currency ?? DEFAULT_FINANCE_CURRENCY),
    dueDate: String(inv.due_date ?? inv.dueDate ?? ""),
    issueDate: String(inv.issue_date ?? inv.issueDate ?? ""),
    status: String(inv.status ?? "draft") as FinanceInvoice["status"],
    notes: inv.notes ?? undefined,
    createdAt: String(inv.created_at ?? inv.createdAt ?? new Date().toISOString()),
    createdBy: String(inv.created_by ?? inv.createdBy ?? "system"),
    updatedAt: (inv.updated_at ?? inv.updatedAt ?? undefined) as string | undefined,
    updatedBy: (inv.updated_by ?? inv.updatedBy ?? undefined) as string | undefined,
  };
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<FinanceInvoice[]>(() => [...mockFinanceInvoices]);
  const [payments, setPayments] = useState<Payment[]>(() => [...mockFinancePayments]);
  const [paymentsByInvoice, setPaymentsByInvoice] = useState<Record<string, Payment[]>>({});
  const [adjustmentRequests, setAdjustmentRequests] = useState<AdjustmentRequest[]>(() => [...mockAdjustmentRequests]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => [...mockCreditNotes]);

  const supabaseEnabled = isSupabaseEnabled();
  const useApi = !supabaseEnabled && isApiEnabled() && !!getAccessToken();

  useEffect(() => {
    let cancelled = false;
    if (supabaseEnabled && supabase) {
      void (async () => {
        try {
          const { data, error } = await supabase.from("finance_invoices").select("*");
          if (error) throw error;
          const mapped = ((data as SupabaseFinanceInvoiceRow[] | null) ?? []).map(supabaseInvoiceToFinanceInvoice);
          if (!cancelled) setInvoices(mapped);
        } catch {
          if (!useApi) return;
          try {
            const list = await financeGetInvoices();
            if (!cancelled) setInvoices(list.map(apiInvoiceToFinanceInvoice));
          } catch {
            // keep fallback
          }
        }
      })();
      return () => { cancelled = true; };
    }
    if (!useApi) return;
    financeGetInvoices()
      .then((list) => setInvoices(list.map(apiInvoiceToFinanceInvoice)))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [useApi, supabaseEnabled]);

  const loadPaymentsForInvoice = useCallback(async (invoiceId: string) => {
    if (supabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase.from("finance_payments").select("*").eq("invoice_id", invoiceId);
        if (error) throw error;
        const asPayments: Payment[] = ((data as Record<string, unknown>[] | null) ?? []).map((p) => ({
          id: String(p.id ?? ""),
          invoiceId: String(p.invoice_id ?? p.invoiceId ?? invoiceId),
          amount: Number(p.amount ?? 0),
          method: String(p.method ?? "other") as Payment["method"],
          reference: typeof p.reference === "string" ? p.reference : undefined,
          date: String(p.date ?? ""),
          recordedBy: String(p.recorded_by ?? p.recordedBy ?? "system"),
          createdAt: String(p.created_at ?? p.createdAt ?? new Date().toISOString()),
        }));
        setPaymentsByInvoice((prev) => ({ ...prev, [invoiceId]: asPayments }));
        return;
      } catch {
        // continue to API fallback
      }
    }
    if (!isApiEnabled()) return;
    try {
      const list = await financeGetPayments(invoiceId);
      const asPayments: Payment[] = list.map((p) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        amount: p.amount,
        method: p.method as Payment["method"],
        reference: p.reference ?? undefined,
        date: p.date,
        recordedBy: p.recordedBy,
        createdAt: p.createdAt,
      }));
      setPaymentsByInvoice((prev) => ({ ...prev, [invoiceId]: asPayments }));
    } catch {
      // keep existing or empty
    }
  }, [supabaseEnabled]);

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
    async (invoiceId: string, payload: { amount: number; method: Payment["method"]; reference?: string; date: string; recordedBy: string }) => {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (!inv) return;
      if (useApi) {
        try {
          const created = await apiRecordPayment(invoiceId, payload);
          const newPayment: Payment = {
            id: created.id,
            invoiceId: created.invoiceId,
            amount: created.amount,
            method: created.method as Payment["method"],
            reference: created.reference ?? undefined,
            date: created.date,
            recordedBy: created.recordedBy,
            createdAt: created.createdAt,
          };
          setPaymentsByInvoice((prev) => ({
            ...prev,
            [invoiceId]: [...(prev[invoiceId] ?? []), newPayment],
          }));
          const newPaid = inv.amountPaid + payload.amount;
          const newBalance = Math.max(0, inv.netAmount - newPaid);
          setInvoices((prev) =>
            prev.map((i) =>
              i.id === invoiceId
                ? {
                    ...i,
                    amountPaid: newPaid,
                    balance: newBalance,
                    status: (newBalance <= 0 ? "paid" : "partially_paid") as FinanceInvoice["status"],
                    updatedAt: new Date().toISOString(),
                  }
                : i
            )
          );
        } catch {
          // caller can show toast
        }
        return;
      }
      if (supabaseEnabled && supabase) {
        try {
          const id = nextPaymentId(payments);
          const now = new Date().toISOString();
          const { error } = await supabase.from("finance_payments").insert({
            id,
            invoice_id: invoiceId,
            amount: payload.amount,
            method: payload.method,
            reference: payload.reference ?? null,
            date: payload.date,
            recorded_by: payload.recordedBy,
            created_at: now,
          });
          if (error) throw error;
          const newPaid = inv.amountPaid + payload.amount;
          const newBalance = Math.max(0, inv.netAmount - newPaid);
          const { error: invErr } = await supabase
            .from("finance_invoices")
            .update({
              amount_paid: newPaid,
              balance: newBalance,
              status: newBalance <= 0 ? "paid" : "partially_paid",
              updated_at: now,
            })
            .eq("id", invoiceId);
          if (invErr) throw invErr;
          setPaymentsByInvoice((prev) => ({
            ...prev,
            [invoiceId]: [
              ...(prev[invoiceId] ?? []),
              {
                id,
                invoiceId,
                amount: payload.amount,
                method: payload.method,
                reference: payload.reference,
                date: payload.date,
                recordedBy: payload.recordedBy,
                createdAt: now,
              },
            ],
          }));
          setInvoices((prev) =>
            prev.map((i) =>
              i.id === invoiceId
                ? {
                    ...i,
                    amountPaid: newPaid,
                    balance: newBalance,
                    status: (newBalance <= 0 ? "paid" : "partially_paid") as FinanceInvoice["status"],
                    updatedAt: now,
                  }
                : i
            )
          );
        } catch {
          // caller can show toast
        }
        return;
      }
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
    [invoices, payments, useApi]
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
    (invoiceId: string) => {
      if (useApi) return (paymentsByInvoice[invoiceId] ?? []).sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date));
      return payments.filter((p) => p.invoiceId === invoiceId).sort((a, b) => b.date.localeCompare(a.date));
    },
    [payments, paymentsByInvoice, useApi]
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
      loadPaymentsForInvoice,
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
      loadPaymentsForInvoice,
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

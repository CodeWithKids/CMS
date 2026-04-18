import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Invoice, Expense } from "@/types";
import type { FinanceInvoice } from "@/types/finance";
import { useFinance } from "@/context/FinanceContext";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import {
  INITIAL_FINANCE_ACCOUNT_INVOICES,
  INITIAL_FINANCE_ACCOUNT_EXPENSES,
} from "@/mockData/financeAccount";

/**
 * Single source of truth for all finance data (income/invoices and expenses).
 * The finance team maintains this data; all views (admin, parent, org, income, expenses, year overview) read from here.
 */

interface FinanceAccountContextType {
  invoices: Invoice[];
  expenses: Expense[];
  getInvoices: () => Invoice[];
  getExpenses: () => Expense[];
  addInvoice: (inv: Omit<Invoice, "id">) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  addExpense: (exp: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
}

const FinanceAccountContext = createContext<FinanceAccountContextType | undefined>(undefined);

type SupabaseExpenseRow = {
  id: string;
  category?: string | null;
  description?: string | null;
  amount?: number | null;
  date?: string | null;
  paid_to?: string | null;
  paidTo?: string | null;
  reference?: string | null;
};

function mapSupabaseExpenseToExpense(row: SupabaseExpenseRow): Expense {
  return {
    id: row.id,
    category: (row.category ?? "misc") as Expense["category"],
    description: row.description ?? "",
    amount: Number(row.amount ?? 0),
    date: row.date ?? new Date().toISOString().slice(0, 10),
    paidTo: row.paid_to ?? row.paidTo ?? "",
    reference: row.reference ?? undefined,
  };
}

function mapFinanceInvoiceToLegacy(inv: FinanceInvoice): Invoice {
  const status: Invoice["status"] =
    inv.status === "draft"
      ? "draft"
      : inv.status === "partially_paid"
        ? "partially_paid"
        : inv.status === "paid"
          ? "paid"
          : "sent";
  return {
    id: inv.id,
    invoiceNumber: inv.id.toUpperCase(),
    term: inv.termId,
    totalAmount: inv.netAmount,
    status,
    dueDate: inv.dueDate,
    source: inv.organisationId ? "organization" : "makerspace",
    paidAmount: inv.amountPaid > 0 ? inv.amountPaid : undefined,
    paidDate: undefined,
    organizationId: inv.organisationId ?? null,
    learnerId: inv.learnerId ?? null,
    description: inv.notes ?? null,
    payerType: inv.organisationId ? "ORGANISATION" : "PARENT",
    sessionType: inv.organisationId ? "ORGANISATION_SESSION" : "MAKERSPACE",
  };
}

function nextInvoiceId(invoices: Invoice[]): string {
  const nums = invoices
    .map((i) => i.id.replace(/\D/g, ""))
    .filter((s) => s.length > 0)
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `inv${max + 1}`;
}

function nextExpenseId(expenses: Expense[]): string {
  const nums = expenses
    .map((e) => e.id.replace(/\D/g, ""))
    .filter((s) => s.length > 0)
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `ex${max + 1}`;
}

export function FinanceAccountProvider({ children }: { children: ReactNode }) {
  const { invoices: financeInvoices } = useFinance();
  const [invoices, setInvoices] = useState<Invoice[]>(() => [...INITIAL_FINANCE_ACCOUNT_INVOICES]);
  const [expenses, setExpenses] = useState<Expense[]>(() => [...INITIAL_FINANCE_ACCOUNT_EXPENSES]);
  const supabaseEnabled = isSupabaseEnabled();

  useEffect(() => {
    if (!financeInvoices || financeInvoices.length === 0) return;
    setInvoices(financeInvoices.map(mapFinanceInvoiceToLegacy));
  }, [financeInvoices]);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase.from("finance_account_expenses").select("*");
        if (error) throw error;
        const mapped = ((data as SupabaseExpenseRow[] | null) ?? []).map(mapSupabaseExpenseToExpense);
        if (!cancelled) setExpenses(mapped);
      } catch {
        // keep current fallback state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled]);

  const getInvoices = useCallback(() => invoices, [invoices]);
  const getExpenses = useCallback(() => expenses, [expenses]);

  const addInvoice = useCallback((inv: Omit<Invoice, "id">) => {
    setInvoices((prev) => {
      const id = nextInvoiceId(prev);
      return [...prev, { ...inv, id }];
    });
  }, []);

  const updateInvoice = useCallback((id: string, patch: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  }, []);

  const addExpense = useCallback((exp: Omit<Expense, "id">) => {
    setExpenses((prev) => {
      const id = nextExpenseId(prev);
      if (supabaseEnabled && supabase) {
        void supabase.from("finance_account_expenses").insert({
          id,
          category: exp.category,
          description: exp.description,
          amount: exp.amount,
          date: exp.date,
          paid_to: exp.paidTo,
          reference: exp.reference ?? null,
        });
      }
      return [...prev, { ...exp, id }];
    });
  }, [supabaseEnabled]);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
    if (supabaseEnabled && supabase) {
      void supabase
        .from("finance_account_expenses")
        .update({
          category: patch.category,
          description: patch.description,
          amount: patch.amount,
          date: patch.date,
          paid_to: patch.paidTo,
          reference: patch.reference ?? null,
        })
        .eq("id", id);
    }
  }, [supabaseEnabled]);

  const value = useMemo<FinanceAccountContextType>(
    () => ({
      invoices,
      expenses,
      getInvoices,
      getExpenses,
      addInvoice,
      updateInvoice,
      addExpense,
      updateExpense,
    }),
    [
      invoices,
      expenses,
      getInvoices,
      getExpenses,
      addInvoice,
      updateInvoice,
      addExpense,
      updateExpense,
    ]
  );

  return (
    <FinanceAccountContext.Provider value={value}>
      {children}
    </FinanceAccountContext.Provider>
  );
}

export function useFinanceAccount() {
  const ctx = useContext(FinanceAccountContext);
  if (!ctx)
    throw new Error("useFinanceAccount must be used within FinanceAccountProvider");
  return ctx;
}

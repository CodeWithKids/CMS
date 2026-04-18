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

  useEffect(() => {
    if (!financeInvoices || financeInvoices.length === 0) return;
    setInvoices(financeInvoices.map(mapFinanceInvoiceToLegacy));
  }, [financeInvoices]);

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
      return [...prev, { ...exp, id }];
    });
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }, []);

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

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { EducatorSessionExpense } from "@/types";
import { mockEducatorSessionExpenses } from "@/mockData";

type SessionExpenseUpdate =
  | Partial<Pick<EducatorSessionExpense, "status" | "issuedAt" | "paidAt" | "processedBy" | "notes">>
  | Partial<Pick<EducatorSessionExpense, "schoolName" | "transportTo" | "transportFrom" | "otherAmount" | "totalRequested" | "notes">>;

type EducatorSessionExpenseInput = Omit<EducatorSessionExpense, "id"> & { id?: string };

interface SessionExpensesContextType {
  expenses: EducatorSessionExpense[];
  getExpenseBySessionAndEducator: (
    sessionId: string,
    educatorId: string
  ) => EducatorSessionExpense | undefined;
  addExpense: (expense: EducatorSessionExpenseInput) => void;
  updateExpense: (id: string, update: SessionExpenseUpdate) => void;
}

const SessionExpensesContext = createContext<SessionExpensesContextType | undefined>(undefined);

function nextId(existing: EducatorSessionExpense[]): string {
  const nums = existing
    .map((e) => e.id.replace("ese", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `ese${max + 1}`;
}

export function SessionExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<EducatorSessionExpense[]>(() => [
    ...mockEducatorSessionExpenses,
  ]);

  const getExpenseBySessionAndEducator = useCallback(
    (sessionId: string, educatorId: string) => {
      return expenses.find(
        (e) => e.sessionId === sessionId && e.educatorId === educatorId
      );
    },
    [expenses]
  );

  const addExpense = useCallback((input: EducatorSessionExpenseInput) => {
    setExpenses((prev) => {
      const id = input.id ?? nextId(prev);
      const expense: EducatorSessionExpense = { ...input, id };
      return [...prev, expense];
    });
  }, []);

  const updateExpense = useCallback((id: string, update: SessionExpenseUpdate) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...update } : e
      )
    );
  }, []);

  return (
    <SessionExpensesContext.Provider
      value={{
        expenses,
        getExpenseBySessionAndEducator,
        addExpense,
        updateExpense,
      }}
    >
      {children}
    </SessionExpensesContext.Provider>
  );
}

export function useSessionExpenses() {
  const ctx = useContext(SessionExpensesContext);
  if (!ctx) throw new Error("useSessionExpenses must be used within SessionExpensesProvider");
  return ctx;
}


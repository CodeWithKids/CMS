import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Partnership } from "@/types";

interface PartnershipsContextType {
  partnerships: Partnership[];
  addPartnership: (p: Omit<Partnership, "id" | "createdAt">) => void;
}

const PartnershipsContext = createContext<PartnershipsContextType | undefined>(undefined);

const INITIAL_PARTNERSHIPS: Partnership[] = [
  { id: "p1", name: "Compassion Miradi", type: "Church", contactPerson: "Pastor Sarah", contactEmail: "miradi@compassion.org", contactPhone: "+27 11 200 2000", status: "active", createdAt: "2026-01-01" },
  { id: "p2", name: "Riverside Academy", type: "School", contactPerson: "Ms. Director", contactEmail: "admin@riverside.ac.za", contactPhone: "+27 11 300 3000", status: "active", createdAt: "2026-01-01" },
  { id: "p3", name: "Greenfield Primary", type: "School", contactPerson: "Mr. Principal", contactEmail: "office@greenfield.edu", status: "active", createdAt: "2026-01-01" },
];

function nextId(partnerships: Partnership[]): string {
  const max = partnerships.reduce((m, p) => {
    const n = parseInt(p.id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `p${max + 1}`;
}

export function PartnershipsProvider({ children }: { children: ReactNode }) {
  const [partnerships, setPartnerships] = useState<Partnership[]>(INITIAL_PARTNERSHIPS);

  const addPartnership = useCallback((p: Omit<Partnership, "id" | "createdAt">) => {
    setPartnerships((prev) => {
      const id = nextId(prev);
      const createdAt = new Date().toISOString().slice(0, 10);
      return [...prev, { ...p, id, createdAt }];
    });
  }, []);

  const value = useMemo(
    () => ({ partnerships, addPartnership }),
    [partnerships, addPartnership]
  );

  return (
    <PartnershipsContext.Provider value={value}>
      {children}
    </PartnershipsContext.Provider>
  );
}

export function usePartnerships() {
  const ctx = useContext(PartnershipsContext);
  if (!ctx) throw new Error("usePartnerships must be used within PartnershipsProvider");
  return ctx;
}

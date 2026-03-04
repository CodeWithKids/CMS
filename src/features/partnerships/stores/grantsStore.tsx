import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GrantOpportunity } from "../types";

interface GrantsStoreType {
  opportunities: GrantOpportunity[];
  addOpportunity: (o: Omit<GrantOpportunity, "id">) => void;
  updateOpportunity: (id: string, patch: Partial<GrantOpportunity>) => void;
  getOpportunity: (id: string) => GrantOpportunity | undefined;
}

const GrantsContext = createContext<GrantsStoreType | undefined>(undefined);

const currentYear = new Date().getFullYear();
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const INITIAL_GRANTS: GrantOpportunity[] = [
  {
    id: "g1",
    name: "STEM Education Scale-Up 2026",
    funderName: "Ministry of Education",
    fundingType: "GRANT",
    amountKes: 2_500_000,
    currency: "KES",
    country: "Kenya",
    programmeFocus: "robotics, girls in STEM",
    deadline: iso(currentYear, 4, 15),
    stage: "APPLYING",
    probability: 0.6,
    expectedDecisionDate: iso(currentYear, 6, 1),
    notes: "Focus on underserved counties.",
    leadName: "Jane Wanjiku",
    assistantNames: ["Peter Ochieng", "Mary Akinyi"],
  },
  {
    id: "g2",
    name: "Tech CSR Partnership",
    funderName: "Safaricom Foundation",
    fundingType: "CSR",
    amountKes: 1_000_000,
    currency: "KES",
    programmeFocus: "digital literacy",
    deadline: iso(currentYear, 3, 30),
    stage: "SUBMITTED",
    probability: 0.5,
    expectedDecisionDate: iso(currentYear, 5, 15),
    leadName: "Peter Ochieng",
    assistantNames: ["Jane Wanjiku"],
  },
  {
    id: "g3",
    name: "Youth Innovation Fund",
    funderName: "Mastercard Foundation",
    fundingType: "GRANT",
    amountKes: 5_000_000,
    programmeFocus: "scholarships, AI",
    deadline: iso(currentYear, 8, 1),
    stage: "SCOPING",
    probability: 0.3,
    leadName: "Mary Akinyi",
    assistantNames: [],
  },
  {
    id: "g4",
    name: "Annual Sponsorship 2026",
    funderName: "Riverside Academy",
    fundingType: "SPONSORSHIP",
    amountKes: 150_000,
    stage: "AWARDED",
    awardedDate: iso(currentYear, 1, 10),
    linkedPartnerId: "p2",
    leadName: "Jane Wanjiku",
    assistantNames: ["Peter Ochieng"],
  },
  {
    id: "g5",
    name: "Community Donation Drive",
    funderName: "Local Rotary Club",
    fundingType: "DONATION",
    amountKes: 75_000,
    stage: "IDEA",
    notes: "To be confirmed Q2.",
    leadName: "Peter Ochieng",
  },
];

function nextId(opportunities: GrantOpportunity[]): string {
  const max = opportunities.reduce((m, o) => {
    const n = parseInt(o.id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `g${max + 1}`;
}

export function GrantsProvider({ children }: { children: ReactNode }) {
  const [opportunities, setOpportunities] = useState<GrantOpportunity[]>(INITIAL_GRANTS);

  const addOpportunity = useCallback((o: Omit<GrantOpportunity, "id">) => {
    setOpportunities((prev) => {
      const id = nextId(prev);
      return [...prev, { ...o, id }];
    });
  }, []);

  const updateOpportunity = useCallback((id: string, patch: Partial<GrantOpportunity>) => {
    setOpportunities((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  }, []);

  const getOpportunity = useCallback(
    (id: string) => opportunities.find((o) => o.id === id),
    [opportunities]
  );

  const value = useMemo<GrantsStoreType>(
    () => ({ opportunities, addOpportunity, updateOpportunity, getOpportunity }),
    [opportunities, addOpportunity, updateOpportunity, getOpportunity]
  );

  return (
    <GrantsContext.Provider value={value}>
      {children}
    </GrantsContext.Provider>
  );
}

export function useGrantsStore() {
  const ctx = useContext(GrantsContext);
  if (!ctx) throw new Error("useGrantsStore must be used within GrantsProvider");
  return ctx;
}

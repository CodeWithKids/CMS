import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Prospect, ProspectStage } from "../types";

interface ProspectsStoreType {
  prospects: Prospect[];
  addProspect: (p: Omit<Prospect, "id">) => void;
  updateProspect: (id: string, patch: Partial<Prospect>) => void;
  getProspect: (id: string) => Prospect | undefined;
}

const ProspectsContext = createContext<ProspectsStoreType | undefined>(undefined);

const INITIAL_PROSPECTS: Prospect[] = [
  {
    id: "pr1",
    name: "Nairobi Tech Hub",
    type: "COMPANY",
    interestAreas: ["PROGRAMME_PARTNER", "IN_KIND_EQUIPMENT"],
    location: "Nairobi",
    mainContactName: "Jane Wanjiku",
    mainContactEmail: "jane@nairobitech.co.ke",
    stage: "MEETING",
    potentialValueKes: 500_000,
    notes: "Interested in after-school coding clubs.",
  },
  {
    id: "pr2",
    name: "Mombasa Girls in STEM",
    type: "NGO",
    interestAreas: ["FINANCIAL_SUPPORT", "VOLUNTEERS"],
    location: "Mombasa",
    mainContactName: "Ali Hassan",
    stage: "CONTACTED",
    potentialValueKes: 200_000,
  },
  {
    id: "pr3",
    name: "St. Paul's Academy",
    type: "SCHOOL",
    interestAreas: ["PROGRAMME_PARTNER"],
    location: "Kisumu",
    mainContactName: "Principal Ochieng",
    mainContactEmail: "admin@stpauls.ac.ke",
    stage: "NEW",
    notes: "Referred by Riverside Academy.",
  },
  {
    id: "pr4",
    name: "Laptop for Kids Foundation",
    type: "FOUNDATION",
    interestAreas: ["IN_KIND_EQUIPMENT"],
    mainContactName: "Mary K.",
    stage: "PROPOSAL_SENT",
    potentialValueKes: 1_000_000,
  },
  {
    id: "pr5",
    name: "Grace Community Church",
    type: "CHURCH",
    interestAreas: ["PROGRAMME_PARTNER", "VOLUNTEERS"],
    location: "Nakuru",
    stage: "NEGOTIATION",
  },
];

function nextId(prospects: Prospect[]): string {
  const max = prospects.reduce((m, p) => {
    const n = parseInt(p.id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `pr${max + 1}`;
}

export function ProspectsProvider({ children }: { children: ReactNode }) {
  const [prospects, setProspects] = useState<Prospect[]>(INITIAL_PROSPECTS);

  const addProspect = useCallback((p: Omit<Prospect, "id">) => {
    setProspects((prev) => {
      const id = nextId(prev);
      return [...prev, { ...p, id }];
    });
  }, []);

  const updateProspect = useCallback((id: string, patch: Partial<Prospect>) => {
    setProspects((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  }, []);

  const getProspect = useCallback(
    (id: string) => prospects.find((p) => p.id === id),
    [prospects]
  );

  const value = useMemo<ProspectsStoreType>(
    () => ({ prospects, addProspect, updateProspect, getProspect }),
    [prospects, addProspect, updateProspect, getProspect]
  );

  return (
    <ProspectsContext.Provider value={value}>
      {children}
    </ProspectsContext.Provider>
  );
}

export function useProspectsStore() {
  const ctx = useContext(ProspectsContext);
  if (!ctx) throw new Error("useProspectsStore must be used within ProspectsProvider");
  return ctx;
}

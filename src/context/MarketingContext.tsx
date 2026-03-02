import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MarketingCampaign } from "@/types";

interface MarketingContextType {
  campaigns: MarketingCampaign[];
  addCampaign: (c: Omit<MarketingCampaign, "id" | "createdAt">) => void;
}

const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  { id: "mc1", name: "STEM Fair 2026", type: "Event", channel: "In-person", status: "active", startDate: "2026-03-01", endDate: "2026-03-15", createdAt: "2026-01-01" },
  { id: "mc2", name: "Parent Newsletter Q1", type: "Email", channel: "Newsletter", status: "completed", startDate: "2026-01-10", endDate: "2026-01-15", createdAt: "2026-01-01" },
  { id: "mc3", name: "School sign-up drive", type: "Social", channel: "Facebook, Instagram", status: "active", startDate: "2026-02-01", partnershipId: "p2", createdAt: "2026-01-15" },
];

function nextId(campaigns: MarketingCampaign[]): string {
  const max = campaigns.reduce((m, c) => {
    const n = parseInt(c.id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `mc${max + 1}`;
}

export function MarketingProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_CAMPAIGNS);

  const addCampaign = useCallback((c: Omit<MarketingCampaign, "id" | "createdAt">) => {
    setCampaigns((prev) => {
      const id = nextId(prev);
      const createdAt = new Date().toISOString().slice(0, 10);
      return [...prev, { ...c, id, createdAt }];
    });
  }, []);

  const value = useMemo(
    () => ({ campaigns, addCampaign }),
    [campaigns, addCampaign]
  );

  return (
    <MarketingContext.Provider value={value}>
      {children}
    </MarketingContext.Provider>
  );
}

export function useMarketing() {
  const ctx = useContext(MarketingContext);
  if (!ctx) throw new Error("useMarketing must be used within MarketingProvider");
  return ctx;
}

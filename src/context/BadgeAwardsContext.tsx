import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { LearnerBadgeAward } from "@/types";

interface BadgeAwardsContextType {
  awards: LearnerBadgeAward[];
  getByLearner: (learnerId: string) => LearnerBadgeAward[];
  getBySession: (sessionId: string) => LearnerBadgeAward[];
  getByLearnerAndSession: (learnerId: string, sessionId: string) => LearnerBadgeAward[];
  addAward: (award: Omit<LearnerBadgeAward, "id">) => void;
}

const BadgeAwardsContext = createContext<BadgeAwardsContextType | undefined>(undefined);

function nextId(awards: LearnerBadgeAward[]): string {
  const nums = awards.map((a) => a.id.replace("ba", "")).filter((s) => /^\d+$/.test(s)).map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `ba${max + 1}`;
}

export function BadgeAwardsProvider({ children }: { children: ReactNode }) {
  const [awards, setAwards] = useState<LearnerBadgeAward[]>([]);

  const getByLearner = useCallback(
    (learnerId: string) => awards.filter((a) => a.learnerId === learnerId),
    [awards]
  );

  const getBySession = useCallback(
    (sessionId: string) => awards.filter((a) => a.sessionId === sessionId),
    [awards]
  );

  const getByLearnerAndSession = useCallback(
    (learnerId: string, sessionId: string) =>
      awards.filter((a) => a.learnerId === learnerId && a.sessionId === sessionId),
    [awards]
  );

  const addAward = useCallback((award: Omit<LearnerBadgeAward, "id">) => {
    setAwards((prev) => [...prev, { ...award, id: nextId(prev) }]);
  }, []);

  const value = useMemo(
    () => ({
      awards,
      getByLearner,
      getBySession,
      getByLearnerAndSession,
      addAward,
    }),
    [awards, getByLearner, getBySession, getByLearnerAndSession, addAward]
  );

  return (
    <BadgeAwardsContext.Provider value={value}>
      {children}
    </BadgeAwardsContext.Provider>
  );
}

export function useBadgeAwards() {
  const ctx = useContext(BadgeAwardsContext);
  if (!ctx) throw new Error("useBadgeAwards must be used within BadgeAwardsProvider");
  return ctx;
}

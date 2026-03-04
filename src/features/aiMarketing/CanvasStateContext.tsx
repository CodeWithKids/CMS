import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  canvasStages,
  getAllInitiatives,
  type CanvasInitiative,
  type CanvasStage,
  type ExperimentStatus,
  type MarketingStageId,
} from "./canvasConfig";

/** Status overrides keyed by initiative id (client-side only; no persistence yet). */
type StatusOverrides = Record<string, ExperimentStatus>;

interface CanvasStateContextType {
  /** Stages with initiative statuses merged from overrides. */
  stages: CanvasStage[];
  /** All initiatives flattened, with current status (including overrides). */
  initiatives: (CanvasInitiative & { stageId: MarketingStageId; stageName: string })[];
  setInitiativeStatus: (initiativeId: string, status: ExperimentStatus) => void;
  getInitiativeStatus: (initiativeId: string) => ExperimentStatus | undefined;
}

const CanvasStateContext = createContext<CanvasStateContextType | undefined>(undefined);

function applyOverrides(
  stages: CanvasStage[],
  overrides: StatusOverrides
): CanvasStage[] {
  return stages.map((stage) => ({
    ...stage,
    initiatives: stage.initiatives.map((init) => ({
      ...init,
      status: overrides[init.id] ?? init.status,
    })),
  }));
}

export function CanvasStateProvider({ children }: { children: ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<StatusOverrides>({});

  const stages = useMemo(
    () => applyOverrides(canvasStages, statusOverrides),
    [statusOverrides]
  );

  const initiatives = useMemo(() => {
    return stages.flatMap((stage) =>
      stage.initiatives.map((init) => ({
        ...init,
        stageId: stage.id,
        stageName: stage.name,
      }))
    );
  }, [stages]);

  const setInitiativeStatus = useCallback((initiativeId: string, status: ExperimentStatus) => {
    setStatusOverrides((prev) => ({ ...prev, [initiativeId]: status }));
  }, []);

  const getInitiativeStatus = useCallback(
    (initiativeId: string): ExperimentStatus | undefined => {
      const base = getAllInitiatives().find((i) => i.id === initiativeId);
      if (!base) return undefined;
      return statusOverrides[initiativeId] ?? base.status;
    },
    [statusOverrides]
  );

  const value = useMemo<CanvasStateContextType>(
    () => ({
      stages,
      initiatives,
      setInitiativeStatus,
      getInitiativeStatus,
    }),
    [stages, initiatives, setInitiativeStatus, getInitiativeStatus]
  );

  return (
    <CanvasStateContext.Provider value={value}>
      {children}
    </CanvasStateContext.Provider>
  );
}

export function useCanvasState() {
  const ctx = useContext(CanvasStateContext);
  if (!ctx) throw new Error("useCanvasState must be used within CanvasStateProvider");
  return ctx;
}

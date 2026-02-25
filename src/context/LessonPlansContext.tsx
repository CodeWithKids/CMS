import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { LessonPlanTemplate, LessonPlanInstance, LessonPlanInstanceStatus } from "@/types";
import { mockLessonPlanTemplates, mockLessonPlanInstances } from "@/mockData";

interface LessonPlansContextType {
  templates: LessonPlanTemplate[];
  instances: LessonPlanInstance[];
  getTemplatesForTrack: (learningTrackId: string) => LessonPlanTemplate[];
  getInstanceForSession: (sessionId: string) => LessonPlanInstance | undefined;
  createInstanceFromTemplate: (sessionId: string, templateId: string) => LessonPlanInstance;
  updateInstance: (sessionId: string, update: Partial<LessonPlanInstance>) => void;
  setInstanceStatus: (sessionId: string, status: LessonPlanInstanceStatus) => void;
}

const LessonPlansContext = createContext<LessonPlansContextType | undefined>(undefined);

function nextInstanceId(instances: LessonPlanInstance[]): string {
  const nums = instances.map((i) => i.id.replace("lpi", "")).filter((s) => /^\d+$/.test(s)).map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `lpi${max + 1}`;
}

function copyTemplateToInstance(sessionId: string, template: LessonPlanTemplate): Omit<LessonPlanInstance, "id" | "sessionId" | "templateId" | "status"> {
  return {
    lessonTitle: template.lessonTitle,
    objectives: [...template.objectives],
    successCriteria: [...template.successCriteria],
    prerequisites: template.prerequisites,
    linksToOtherSessions: template.linksToOtherSessions,
    devices: [...template.devices],
    software: [...template.software],
    materials: [...template.materials],
    setupNotes: template.setupNotes,
    blocks: template.blocks.map((b) => ({ ...b, id: `${b.id}-${Date.now()}` })),
    supportStrategies: template.supportStrategies,
    extensionIdeas: template.extensionIdeas,
    assessmentMethods: template.assessmentMethods,
    evidenceOfLearning: template.evidenceOfLearning,
    homework: template.homework,
  };
}

export function LessonPlansProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<LessonPlanInstance[]>(() => [...mockLessonPlanInstances]);
  const templates = mockLessonPlanTemplates;

  const getTemplatesForTrack = useCallback(
    (learningTrackId: string) => templates.filter((t) => t.learningTrackId === learningTrackId),
    []
  );

  const getInstanceForSession = useCallback(
    (sessionId: string) => instances.find((i) => i.sessionId === sessionId),
    [instances]
  );

  const createInstanceFromTemplate = useCallback((sessionId: string, templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) throw new Error("Template not found");
    const now = new Date().toISOString().split("T")[0];
    const id = nextInstanceId(instances);
    const newInstance: LessonPlanInstance = {
      id,
      sessionId,
      templateId,
      status: "draft",
      ...copyTemplateToInstance(sessionId, template),
      createdAt: now,
      updatedAt: now,
      createdBy: undefined,
      updatedBy: undefined,
    };
    setInstances((prev) => [...prev, newInstance]);
    return newInstance;
  }, [instances, templates]);

  const updateInstance = useCallback((sessionId: string, update: Partial<LessonPlanInstance>) => {
    const now = new Date().toISOString().split("T")[0];
    setInstances((prev) =>
      prev.map((i) =>
        i.sessionId === sessionId
          ? { ...i, ...update, updatedAt: now }
          : i
      )
    );
  }, []);

  const setInstanceStatus = useCallback((sessionId: string, status: LessonPlanInstanceStatus) => {
    setInstances((prev) =>
      prev.map((i) => (i.sessionId === sessionId ? { ...i, status } : i))
    );
  }, []);

  const value = useMemo(
    () => ({
      templates,
      instances,
      getTemplatesForTrack,
      getInstanceForSession,
      createInstanceFromTemplate,
      updateInstance,
      setInstanceStatus,
    }),
    [
      instances,
      getTemplatesForTrack,
      getInstanceForSession,
      createInstanceFromTemplate,
      updateInstance,
      setInstanceStatus,
    ]
  );

  return (
    <LessonPlansContext.Provider value={value}>
      {children}
    </LessonPlansContext.Provider>
  );
}

export function useLessonPlans() {
  const ctx = useContext(LessonPlansContext);
  if (!ctx) throw new Error("useLessonPlans must be used within LessonPlansProvider");
  return ctx;
}

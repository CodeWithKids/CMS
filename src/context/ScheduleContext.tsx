import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { AvailabilitySlot } from "@/types";
import { mockAvailabilitySlots } from "@/mockData";

interface ScheduleContextType {
  slots: AvailabilitySlot[];
  getSlotsForEducator: (educatorId: string) => AvailabilitySlot[];
  addSlot: (slot: Omit<AvailabilitySlot, "id">) => void;
  updateSlot: (id: string, update: Partial<AvailabilitySlot>) => void;
  removeSlot: (id: string) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

function nextId(slots: AvailabilitySlot[]): string {
  const nums = slots.map((s) => s.id.replace("av", "")).filter((s) => /^\d+$/.test(s)).map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `av${max + 1}`;
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() => [...mockAvailabilitySlots]);

  const getSlotsForEducator = useCallback(
    (educatorId: string) => slots.filter((s) => s.educatorId === educatorId),
    [slots]
  );

  const addSlot = useCallback((slot: Omit<AvailabilitySlot, "id">) => {
    setSlots((prev) => {
      const id = nextId(prev);
      return [...prev, { ...slot, id }];
    });
  }, []);

  const updateSlot = useCallback((id: string, update: Partial<AvailabilitySlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)));
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo(
    () => ({ slots, getSlotsForEducator, addSlot, updateSlot, removeSlot }),
    [slots, getSlotsForEducator, addSlot, updateSlot, removeSlot]
  );

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}

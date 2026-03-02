import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { EventRegistration } from "@/types";
import { mockEventRegistrations } from "@/mockData";

export interface EventRegistrationsContextValue {
  /** All registrations (for a given event or globally). */
  getRegistrationsForEvent: (eventId: string) => EventRegistration[];
  getRegisteredLearnerIds: (eventId: string) => string[];
  isLearnerRegistered: (eventId: string, learnerId: string) => boolean;
  registerLearner: (eventId: string, learnerId: string) => void;
  unregisterLearner: (eventId: string, learnerId: string) => void;
}

const EventRegistrationsContext = createContext<EventRegistrationsContextValue | undefined>(undefined);

function now(): string {
  return new Date().toISOString();
}

export function EventRegistrationsProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>(mockEventRegistrations);
  const nextIdRef = useRef(mockEventRegistrations.length + 1);

  const getRegistrationsForEvent = useCallback(
    (eventId: string) => registrations.filter((r) => r.eventId === eventId),
    [registrations]
  );

  const getRegisteredLearnerIds = useCallback(
    (eventId: string) =>
      registrations.filter((r) => r.eventId === eventId).map((r) => r.learnerId),
    [registrations]
  );

  const isLearnerRegistered = useCallback(
    (eventId: string, learnerId: string) =>
      registrations.some((r) => r.eventId === eventId && r.learnerId === learnerId),
    [registrations]
  );

  const registerLearner = useCallback((eventId: string, learnerId: string) => {
    setRegistrations((prev) => {
      if (prev.some((r) => r.eventId === eventId && r.learnerId === learnerId)) return prev;
      const id = `er-${nextIdRef.current++}`;
      return [...prev, { id, eventId, learnerId, registeredAt: now() }];
    });
  }, []);

  const unregisterLearner = useCallback((eventId: string, learnerId: string) => {
    setRegistrations((prev) =>
      prev.filter((r) => !(r.eventId === eventId && r.learnerId === learnerId))
    );
  }, []);

  const value = useMemo<EventRegistrationsContextValue>(
    () => ({
      getRegistrationsForEvent,
      getRegisteredLearnerIds,
      isLearnerRegistered,
      registerLearner,
      unregisterLearner,
    }),
    [
      getRegistrationsForEvent,
      getRegisteredLearnerIds,
      isLearnerRegistered,
      registerLearner,
      unregisterLearner,
    ]
  );

  return (
    <EventRegistrationsContext.Provider value={value}>
      {children}
    </EventRegistrationsContext.Provider>
  );
}

export function useEventRegistrations(): EventRegistrationsContextValue {
  const ctx = useContext(EventRegistrationsContext);
  if (ctx === undefined) {
    throw new Error("useEventRegistrations must be used within EventRegistrationsProvider");
  }
  return ctx;
}

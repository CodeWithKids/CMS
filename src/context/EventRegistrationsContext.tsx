import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { EventRegistration } from "@/types";
import { mockEventRegistrations } from "@/mockData";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

export interface EventRegistrationsContextValue {
  /** All registrations (for a given event or globally). */
  getRegistrationsForEvent: (eventId: string) => EventRegistration[];
  getRegisteredLearnerIds: (eventId: string) => string[];
  isLearnerRegistered: (eventId: string, learnerId: string) => boolean;
  registerLearner: (eventId: string, learnerId: string) => void;
  unregisterLearner: (eventId: string, learnerId: string) => void;
}

const EventRegistrationsContext = createContext<EventRegistrationsContextValue | undefined>(undefined);

type SupabaseRegistrationRow = {
  id: string;
  event_id?: string | null;
  eventId?: string | null;
  learner_id?: string | null;
  learnerId?: string | null;
  registered_at?: string | null;
  registeredAt?: string | null;
};

function mapSupabaseRowToRegistration(row: SupabaseRegistrationRow): EventRegistration | null {
  const eventId = row.event_id ?? row.eventId;
  const learnerId = row.learner_id ?? row.learnerId;
  if (!eventId || !learnerId) return null;
  return {
    id: row.id,
    eventId,
    learnerId,
    registeredAt: row.registered_at ?? row.registeredAt ?? now(),
  };
}

function now(): string {
  return new Date().toISOString();
}

export function EventRegistrationsProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>(mockEventRegistrations);
  const nextIdRef = useRef(mockEventRegistrations.length + 1);
  const supabaseEnabled = isSupabaseEnabled();

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase.from("event_registrations").select("*");
        if (error) throw error;
        const mapped = ((data as SupabaseRegistrationRow[] | null) ?? [])
          .map(mapSupabaseRowToRegistration)
          .filter((r): r is EventRegistration => r !== null);
        if (!cancelled) {
          setRegistrations(mapped);
          nextIdRef.current = mapped.length + 1;
        }
      } catch {
        // keep mock fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled]);

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
      const registration = { id, eventId, learnerId, registeredAt: now() };
      if (supabaseEnabled && supabase) {
        void supabase.from("event_registrations").insert({
          id,
          event_id: eventId,
          learner_id: learnerId,
          registered_at: registration.registeredAt,
        });
      }
      return [...prev, registration];
    });
  }, [supabaseEnabled]);

  const unregisterLearner = useCallback((eventId: string, learnerId: string) => {
    setRegistrations((prev) =>
      prev.filter((r) => !(r.eventId === eventId && r.learnerId === learnerId))
    );
    if (supabaseEnabled && supabase) {
      void supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", eventId)
        .eq("learner_id", learnerId);
    }
  }, [supabaseEnabled]);

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

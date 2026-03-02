import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { CoachingInvite, CoachingInviteStatus, Session } from "@/types";
import { mockCoachingInvites } from "@/mockData";
import { useSessions } from "@/context/SessionsContext";
import { isEducatorsMeetingSlot, isTeamMeetingSlot } from "@/lib/compulsoryCalendarBlocks";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

export interface CoachingInviteInput {
  educatorId: string;
  createdById: string;
  date: string;
  startTime: string;
  endTime: string;
  title?: string | null;
  notes?: string | null;
}

export interface SlotAvailability {
  available: boolean;
  conflictingSession?: Session | null;
  /** When available is false and not due to a session, e.g. team meeting. */
  reason?: string;
}

interface CoachingInvitesContextType {
  invites: CoachingInvite[];
  getById: (id: string) => CoachingInvite | undefined;
  getForEducator: (educatorId: string) => CoachingInvite[];
  getPendingForEducator: (educatorId: string) => CoachingInvite[];
  getCreatedBy: (ldmId: string) => CoachingInvite[];
  /** Check if educator has no class at date+time; LDM can only create in available slots. */
  checkSlotAvailability: (
    educatorId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeInviteId?: string
  ) => SlotAvailability;
  create: (input: CoachingInviteInput) => CoachingInvite;
  accept: (id: string) => void;
  decline: (id: string) => void;
}

const CoachingInvitesContext = createContext<CoachingInvitesContextType | undefined>(undefined);

function nextId(invites: CoachingInvite[]): string {
  const nums = invites
    .map((i) => i.id.replace("ci", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `ci${max + 1}`;
}

export function CoachingInvitesProvider({ children }: { children: ReactNode }) {
  const [invites, setInvites] = useState<CoachingInvite[]>(() => [...mockCoachingInvites]);
  const { getSessionsForEducatorByRole } = useSessions();

  const getById = useCallback(
    (id: string) => invites.find((i) => i.id === id),
    [invites]
  );

  const getForEducator = useCallback(
    (educatorId: string) =>
      invites
        .filter((i) => i.educatorId === educatorId)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [invites]
  );

  const getPendingForEducator = useCallback(
    (educatorId: string) =>
      invites.filter((i) => i.educatorId === educatorId && i.status === "pending"),
    [invites]
  );

  const getCreatedBy = useCallback(
    (ldmId: string) =>
      invites
        .filter((i) => i.createdById === ldmId)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [invites]
  );

  const checkSlotAvailability = useCallback(
    (
      educatorId: string,
      date: string,
      startTime: string,
      endTime: string,
      excludeInviteId?: string
    ): SlotAvailability => {
      if (isTeamMeetingSlot(date, startTime, endTime)) {
        return { available: false, conflictingSession: null, reason: "Monday 9:00–10:00 is blocked for compulsory team meeting." };
      }
      if (isEducatorsMeetingSlot(date, startTime, endTime)) {
        return { available: false, conflictingSession: null, reason: "Thursday 9:00–10:00 is blocked for compulsory educators meeting (bi-weekly)." };
      }
      const sessionsOnDate = getSessionsForEducatorByRole(educatorId, { date });
      const conflicting = sessionsOnDate.find((s) =>
        timeRangesOverlap(s.startTime, s.endTime, startTime, endTime)
      );
      if (conflicting) return { available: false, conflictingSession: conflicting };

      const otherInvitesSameDay = invites.filter(
        (i) =>
          i.educatorId === educatorId &&
          i.date === date &&
          i.id !== excludeInviteId &&
          (i.status === "pending" || i.status === "accepted")
      );
      const conflictingInvite = otherInvitesSameDay.find((i) =>
        timeRangesOverlap(i.startTime, i.endTime, startTime, endTime)
      );
      if (conflictingInvite) return { available: false, conflictingSession: null };

      return { available: true };
    },
    [invites, getSessionsForEducatorByRole]
  );

  const create = useCallback(
    (input: CoachingInviteInput): CoachingInvite => {
      const availability = checkSlotAvailability(
        input.educatorId,
        input.date,
        input.startTime,
        input.endTime
      );
      if (!availability.available) {
        throw new Error(
          availability.conflictingSession
            ? "Educator has a class at this time. Choose a slot when they have no classes."
            : "This time slot is not available."
        );
      }
      const now = new Date().toISOString();
      const invite: CoachingInvite = {
        id: nextId(invites),
        educatorId: input.educatorId,
        createdById: input.createdById,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        title: input.title ?? null,
        notes: input.notes ?? null,
        status: "pending",
        createdAt: now,
      };
      setInvites((prev) => [...prev, invite]);
      return invite;
    },
    [invites, checkSlotAvailability]
  );

  const accept = useCallback((id: string) => {
    const now = new Date().toISOString();
    setInvites((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "accepted" as CoachingInviteStatus, respondedAt: now } : i
      )
    );
  }, []);

  const decline = useCallback((id: string) => {
    const now = new Date().toISOString();
    setInvites((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "declined" as CoachingInviteStatus, respondedAt: now } : i
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      invites,
      getById,
      getForEducator,
      getPendingForEducator,
      getCreatedBy,
      checkSlotAvailability,
      create,
      accept,
      decline,
    }),
    [
      invites,
      getById,
      getForEducator,
      getPendingForEducator,
      getCreatedBy,
      checkSlotAvailability,
      create,
      accept,
      decline,
    ]
  );

  return (
    <CoachingInvitesContext.Provider value={value}>
      {children}
    </CoachingInvitesContext.Provider>
  );
}

export function useCoachingInvites() {
  const ctx = useContext(CoachingInvitesContext);
  if (!ctx) throw new Error("useCoachingInvites must be used within CoachingInvitesProvider");
  return ctx;
}

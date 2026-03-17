import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSessions } from "@/context/SessionsContext";
import { mockClasses, getCurrentTerm } from "@/mockData";
import { LEARNING_TRACK_LABELS, SESSION_TYPE_LABELS } from "@/types";
import type { SessionType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { classesGetAll, isApiEnabled, type ClassApi } from "@/lib/api";
import { BookOpen, ArrowLeft } from "lucide-react";

const SESSION_TYPE_ORDER: SessionType[] = [
  "makerspace",
  "school_stem_club",
  "virtual",
  "home",
  "organization",
  "miradi",
];

export default function EducatorClassesPage() {
  const { currentUser } = useAuth();
  const educatorId = currentUser?.id ?? "";
  const { getSessionsForEducatorByRole, getSessionsForClass } = useSessions();

  const apiEnabled = isApiEnabled();
  const { data: apiClasses = [], isLoading } = useQuery({
    queryKey: ["educator", "classes", educatorId],
    queryFn: () => classesGetAll({ educatorId }),
    enabled: apiEnabled && !!educatorId,
    staleTime: 5 * 60 * 1000,
  });

  const myClasses: ClassApi[] = useMemo(() => {
    if (apiEnabled) return apiClasses;
    return mockClasses.filter(
      (c) =>
        c.educatorId === educatorId ||
        getSessionsForEducatorByRole(educatorId, { from: "2000-01-01", to: "2099-12-31" }).some(
          (s) =>
            s.classId === c.id &&
            (s.leadEducatorId === educatorId || (s.assistantEducatorIds ?? []).includes(educatorId))
        )
    );
  }, [apiEnabled, apiClasses, educatorId, getSessionsForEducatorByRole]);

  const tracksByClass = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of myClasses) {
      const sessions = getSessionsForClass(c.id);
      const tracks = [...new Set(sessions.map((s) => s.learningTrack))];
      map.set(c.id, tracks.map((t) => LEARNING_TRACK_LABELS[t] ?? t));
    }
    return map;
  }, [myClasses, getSessionsForClass]);

  const sessionTypeByClass = useMemo(() => {
    const map = new Map<string, SessionType>();
    for (const c of myClasses) {
      const sessions = getSessionsForClass(c.id);
      const types = sessions.map((s) => s.sessionType);
      const primary = types.length > 0 ? types[0] : "makerspace";
      map.set(c.id, primary);
    }
    return map;
  }, [myClasses, getSessionsForClass]);

  const myClassesByProgramType = useMemo(() => {
    const byType = new Map<SessionType, ClassApi[]>();
    for (const st of SESSION_TYPE_ORDER) byType.set(st, []);
    for (const c of myClasses) {
      const st = sessionTypeByClass.get(c.id) ?? "makerspace";
      const list = byType.get(st) ?? [];
      list.push(c);
      byType.set(st, list);
    }
    return SESSION_TYPE_ORDER.flatMap((st) => (byType.get(st) ?? []).map((c) => ({ class: c, sessionType: st })));
  }, [myClasses, sessionTypeByClass]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link
          to="/educator/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary" /> My classes
        </h1>
        <p className="text-muted-foreground mt-1">
          Classes you lead or coach. Click a class to see enrolment, sessions, and attendance.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          Loading your classes…
        </div>
      ) : myClassesByProgramType.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-foreground">No classes assigned yet</p>
          <p className="text-sm mt-1">When you’re assigned to lead or coach a class, it will appear here.</p>
          <Link to="/educator/dashboard" className="inline-block mt-4 text-sm text-primary hover:underline">
            Back to dashboard
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-5">
          <div className="space-y-3">
            {myClassesByProgramType.map(({ class: c, sessionType }) => {
              const tracks = tracksByClass.get(c.id) ?? [];
              const programLabel = SESSION_TYPE_LABELS[sessionType];
              return (
                <Link
                  key={c.id}
                  to={`/educator/classes/${c.id}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{programLabel}</span>
                    {" · "}
                    {c.ageGroup} · {c.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(c.learnerIds?.length ?? 0)} learners
                    {tracks.length > 0 && (
                      <span className="ml-1">· Tracks: {tracks.join(", ")}</span>
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

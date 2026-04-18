import { useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useSessions } from "@/context/SessionsContext";
import { useLearners } from "@/hooks/useLearners";
import { useParentChildIds } from "@/hooks/useParentChildIds";
import { useClasses } from "@/hooks/useClasses";
import { User, Calendar, History, ArrowLeft, Clock } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return d;
  }
}

export default function ParentChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getByLearner, loadSessionRecords } = useAttendance();
  const { sessions } = useSessions();
  const { classes } = useClasses();
  const { getEnrollmentsForLearner } = useEnrollments();
  const { learners } = useLearners();
  const learnerById = useMemo(
    () => new Map(learners.map((learner) => [learner.id, learner])),
    [learners]
  );
  const { childIds } = useParentChildIds();

  const learner = id ? learnerById.get(id) : undefined;
  const allowed = id != null && childIds.includes(id);
  const effectiveLearnerId = allowed && id ? id : undefined;

  const classIdsForLearner = useMemo(() => {
    const set = new Set<string>();
    if (!effectiveLearnerId) return set;
    for (const e of getEnrollmentsForLearner(effectiveLearnerId)) {
      set.add(e.classId);
    }
    for (const c of classes) {
      if ((c.learnerIds ?? []).includes(effectiveLearnerId)) set.add(c.id);
    }
    return set;
  }, [effectiveLearnerId, classes, getEnrollmentsForLearner]);

  const sessionsForLearner = useMemo(() => {
    if (!effectiveLearnerId) return [];
    return sessions.filter((s) => classIdsForLearner.has(s.classId));
  }, [effectiveLearnerId, sessions, classIdsForLearner]);

  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  const sessionIdsKey = useMemo(
    () =>
      [...sessionsForLearner]
        .map((s) => s.id)
        .sort()
        .join(","),
    [sessionsForLearner]
  );

  useEffect(() => {
    if (!effectiveLearnerId || sessionIdsKey.length === 0) return;
    void Promise.all(sessionIdsKey.split(",").map((sid) => loadSessionRecords(sid)));
  }, [effectiveLearnerId, sessionIdsKey, loadSessionRecords]);

  const { upcoming, history: past } = useMemo(() => {
    const up = sessionsForLearner.filter((s) => s.date >= today).sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : (a.startTime ?? "").localeCompare(b.startTime ?? "");
    });
    const pastSessions = sessionsForLearner.filter((s) => s.date < today).sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      return d !== 0 ? d : (b.startTime ?? "").localeCompare(a.startTime ?? "");
    });
    return { upcoming: up, history: pastSessions };
  }, [sessionsForLearner]);

  const attendanceBySession = useMemo(() => {
    if (!effectiveLearnerId) return new Map<string, string>();
    const records = getByLearner(effectiveLearnerId);
    const map = new Map<string, string>();
    records.forEach((r) => map.set(r.sessionId, r.status));
    return map;
  }, [effectiveLearnerId, getByLearner]);

  if (!id || !learner || !allowed) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Child not found or you don’t have access.</p>
        <button
          type="button"
          onClick={() => navigate("/parent/dashboard")}
          className="text-primary hover:underline mt-2"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/parent/dashboard")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {/* Profile summary */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title text-xl mt-0">
              {learner.firstName} {learner.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">{learner.school}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {learner.programType.replace("_", " ")} · {learner.status}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming sessions (timetable) */}
      <section className="mb-6">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-accent" /> Upcoming sessions
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border bg-card p-5 text-center text-muted-foreground text-sm">
            No upcoming sessions scheduled.
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y">
            {upcoming.slice(0, 10).map((s) => {
              const className = classNameById.get(s.classId) ?? s.classId;
              return (
                <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{className}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(s.date)}
                      {s.startTime != null && s.endTime != null && ` · ${s.startTime} – ${s.endTime}`}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
            {upcoming.length > 10 && (
              <p className="p-3 text-sm text-muted-foreground text-center">
                +{upcoming.length - 10} more
              </p>
            )}
          </div>
        )}
      </section>

      {/* Session history */}
      <section>
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-accent" /> Session history
        </h2>
        {past.length === 0 ? (
          <div className="rounded-xl border bg-card p-5 text-center text-muted-foreground text-sm">
            No past sessions yet.
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y">
            {past.slice(0, 15).map((s) => {
              const className = classNameById.get(s.classId) ?? s.classId;
              const status = attendanceBySession.get(s.id);
              return (
                <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{className}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(s.date)}
                      {s.startTime != null && s.endTime != null && ` · ${s.startTime} – ${s.endTime}`}
                    </p>
                  </div>
                  {status != null && (
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                        status === "present" || status === "late"
                          ? "bg-success/10 text-success"
                          : status === "absent"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {status}
                    </span>
                  )}
                </div>
              );
            })}
            {past.length > 15 && (
              <p className="p-3 text-sm text-muted-foreground text-center">
                +{past.length - 15} more
              </p>
            )}
          </div>
        )}
      </section>

      <div className="mt-6">
        <Link to="/parent/invoices" className="text-sm text-primary hover:underline">
          View invoices for your children →
        </Link>
      </div>
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useSessionExpenses } from "@/context/SessionExpensesContext";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { useInventory } from "@/context/InventoryContext";
import { useEducatorNotes } from "@/context/EducatorNotesContext";
import { mockClasses, getClass, getCurrentTerm } from "@/mockData";
import { useSessions } from "@/context/SessionsContext";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";
import { EducatorSessionCard } from "@/features/educator/components/EducatorSessionCard";
import { computeEducatorBadges } from "@/utils/educatorBadges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Clock, BookOpen, History, AlertCircle, Wallet, Laptop, Award, StickyNote } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const m = new Date(d);
  m.setDate(diff);
  return m.toISOString().split("T")[0];
}

export default function EducatorDashboard() {
  const { currentUser } = useAuth();
  const educatorId = currentUser?.id ?? "";
  const { getBySession: getAttendanceBySession } = useAttendance();
  const { getBySession: getReportBySession } = useSessionReports();
  const { getExpenseBySessionAndEducator } = useSessionExpenses();
  const { getInstanceForSession } = useLessonPlans();
  const { getItemsCheckedOutTo } = useInventory();
  const { getSessionsForEducatorByRole, getSessionsForClass } = useSessions();
  const { getNotesForDate, addNoteForDate } = useEducatorNotes();

  const todaySessions = useMemo(
    () => getSessionsForEducatorByRole(educatorId, { date: today }),
    [educatorId, getSessionsForEducatorByRole]
  );
  const upcomingSessions = useMemo(
    () =>
      getSessionsForEducatorByRole(educatorId, { from: today })
        .filter((s) => s.date > today)
        .slice(0, 10),
    [educatorId, getSessionsForEducatorByRole]
  );
  const pastSessions = useMemo(
    () => getSessionsForEducatorByRole(educatorId, { past: true }).slice(0, 5),
    [educatorId, getSessionsForEducatorByRole]
  );

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const sessionsWithoutReport = useMemo(
    () =>
      getSessionsForEducatorByRole(educatorId, { from: weekStart, to: today }).filter(
        (s) => getReportBySession(s.id)?.status !== "submitted"
      ),
    [educatorId, weekStart, getReportBySession, getSessionsForEducatorByRole]
  );
  const reminderCount = sessionsWithoutReport.length;

  const myClasses = useMemo(
    () =>
      mockClasses.filter(
        (c) =>
          c.educatorId === educatorId ||
          getSessionsForEducatorByRole(educatorId, { from: "2000-01-01", to: "2099-12-31" }).some(
            (s) => s.classId === c.id && (s.leadEducatorId === educatorId || (s.assistantEducatorIds ?? []).includes(educatorId))
          )
      ),
    [educatorId, getSessionsForEducatorByRole]
  );

  const termRange = useMemo(() => {
    const term = getCurrentTerm();
    return term ? { from: term.startDate, to: term.endDate } : { from: weekStart, to: today };
  }, [weekStart]);

  const hoursSummary = useMemo(() => {
    const sessions = getSessionsForEducatorByRole(educatorId, { from: termRange.from, to: termRange.to });
    let facilitating = 0;
    let coaching = 0;
    for (const s of sessions) {
      if (s.leadEducatorId === educatorId) facilitating += s.durationHours ?? 1;
      else if ((s.assistantEducatorIds ?? []).includes(educatorId)) coaching += s.durationHours ?? 1;
    }
    return { facilitating, coaching, sessionCount: sessions.length, classCount: new Set(sessions.map((s) => s.classId)).size };
  }, [educatorId, termRange, getSessionsForEducatorByRole]);

  const myDevices = useMemo(() => getItemsCheckedOutTo(educatorId), [getItemsCheckedOutTo, educatorId]);

  const allSessionsForBadges = useMemo(
    () => getSessionsForEducatorByRole(educatorId, { from: "2000-01-01", to: "2099-12-31" }),
    [educatorId, getSessionsForEducatorByRole]
  );
  const dashboardBadges = useMemo(() => computeEducatorBadges(educatorId, allSessionsForBadges), [educatorId, allSessionsForBadges]);

  const tracksByClass = useMemo(() => {
    const map = new Map<string, LearningTrack[]>();
    for (const c of myClasses) {
      const sessions = getSessionsForClass(c.id);
      const tracks = [...new Set(sessions.map((s) => s.learningTrack))];
      map.set(c.id, tracks);
    }
    return map;
  }, [myClasses, getSessionsForClass]);

  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayNoteText, setTodayNoteText] = useState("");

  const todayNotes = useMemo(() => getNotesForDate(today), [today, getNotesForDate]);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Educator Dashboard</h1>
      <p className="page-subtitle">Welcome back, {currentUser?.name}</p>
      <p className="text-sm text-muted-foreground mb-4">Your classes and devices are below.</p>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn’t load your dashboard.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setLoadError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {reminderCount > 0 && (
        <div className="mb-4 p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 flex items-center gap-2 text-sm flex-wrap">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You still have {reminderCount} session{reminderCount !== 1 ? "s" : ""} without reports. Sessions are not complete until the report is submitted.
          </span>
          {sessionsWithoutReport[0] && (
            <Link to={`/educator/sessions/${sessionsWithoutReport[0].id}/report`} className="text-primary hover:underline font-medium shrink-0">
              Fill session report
            </Link>
          )}
        </div>
      )}

      {/* Hours summary */}
      <div className="mb-6 p-4 rounded-xl border bg-card grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Facilitating (this term)</p>
          <p className="text-xl font-semibold">{hoursSummary.facilitating}h</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Coaching (this term)</p>
          <p className="text-xl font-semibold">{hoursSummary.coaching}h</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
          <p className="text-xl font-semibold">{hoursSummary.sessionCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Classes</p>
          <p className="text-xl font-semibold">{hoursSummary.classCount}</p>
        </div>
      </div>

      {dashboardBadges.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border bg-card">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-500" /> Your badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {dashboardBadges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20 text-sm font-medium"
                title={b.description}
              >
                {b.name}
              </span>
            ))}
          </div>
          <Link to="/educator/profile" className="text-sm text-primary hover:underline mt-2 inline-block">
            View all on profile →
          </Link>
        </div>
      )}

      {/* Today's notes / reminders */}
      <div className="mb-6 p-4 rounded-xl border bg-card">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <StickyNote className="w-5 h-5 text-primary" /> Today&apos;s notes
        </h2>
        <p className="text-sm text-muted-foreground mb-3">Quick reminders or notes for today. Session-specific notes are on each session card.</p>
        {todayNotes.length > 0 && (
          <ul className="space-y-2 mb-3">
            {todayNotes.map((n) => (
              <li key={n.id} className="text-sm rounded-md bg-muted/50 px-3 py-2 whitespace-pre-wrap">
                {n.text}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Add a note or reminder for today..."
            value={todayNoteText}
            onChange={(e) => setTodayNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const t = todayNoteText.trim();
                if (t) {
                  addNoteForDate(today, t);
                  setTodayNoteText("");
                }
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const t = todayNoteText.trim();
              if (t) {
                addNoteForDate(today, t);
                setTodayNoteText("");
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-accent" /> Today&apos;s sessions
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions today.</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s) => (
                <EducatorSessionCard
                  key={s.id}
                  session={s}
                  currentUser={currentUser}
                  lessonPlanStatus={getInstanceForSession(s.id)?.status ?? "not_started"}
                  attendanceStatus={getAttendanceBySession(s.id).length > 0 ? "done" : "pending"}
                  reportStatus={(getReportBySession(s.id)?.status as "draft" | "submitted") ?? "pending"}
                  expensesStatus={getExpenseBySessionAndEducator(s.id, educatorId) ? "logged" : "pending"}
                  hasDeviceCheckedOut={myDevices.length > 0}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" /> Upcoming sessions
          </h2>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((s) => (
                <EducatorSessionCard
                  key={s.id}
                  session={s}
                  currentUser={currentUser}
                  lessonPlanStatus={getInstanceForSession(s.id)?.status ?? "not_started"}
                  attendanceStatus={getAttendanceBySession(s.id).length > 0 ? "done" : "pending"}
                  reportStatus={(getReportBySession(s.id)?.status as "draft" | "submitted") ?? "pending"}
                  expensesStatus={getExpenseBySessionAndEducator(s.id, educatorId) ? "logged" : "pending"}
                  hasDeviceCheckedOut={myDevices.length > 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" /> Past sessions
        </h2>
        {pastSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past sessions.</p>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((s) => (
              <EducatorSessionCard
                key={s.id}
                session={s}
                currentUser={currentUser}
                lessonPlanStatus={getInstanceForSession(s.id)?.status ?? "not_started"}
                attendanceStatus={getAttendanceBySession(s.id).length > 0 ? "done" : "pending"}
                reportStatus={(getReportBySession(s.id)?.status as "draft" | "submitted") ?? "pending"}
                expensesStatus={getExpenseBySessionAndEducator(s.id, educatorId) ? "logged" : "pending"}
                hasDeviceCheckedOut={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* My devices */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Laptop className="w-5 h-5 text-primary" /> My devices
        </h2>
        {myDevices.length > 0 ? (
          <ul className="space-y-2">
            {myDevices.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.checkedOutAt ? new Date(item.checkedOutAt).toLocaleDateString("en-ZA") : "—"}
                  {item.dueAt && ` · Due ${new Date(item.dueAt).toLocaleDateString("en-ZA")}`}
                </span>
                <Link to={`/inventory/${item.id}`} className="text-primary hover:underline text-sm">
                  View
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">No devices checked out.</p>
            <Link to="/inventory" className="text-sm text-primary hover:underline mt-2 inline-block">
              Browse inventory →
            </Link>
          </>
        )}
      </div>

      {/* My Classes */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" /> My Classes
        </h2>
        <div className="space-y-3">
          {myClasses.map((c) => {
            const tracks = tracksByClass.get(c.id) ?? [];
            return (
              <Link key={c.id} to={`/educator/classes/${c.id}`} className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.program} · {c.ageGroup} · {c.location}</p>
                <p className="text-xs text-muted-foreground">
                  {c.learnerIds.length} learners
                  {tracks.length > 0 && (
                    <span className="ml-1">
                      · Tracks: {tracks.map((t) => LEARNING_TRACK_LABELS[t] ?? t).join(", ")}
                    </span>
                  )}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

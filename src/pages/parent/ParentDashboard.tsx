import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { parentChildMap, getLearner, getTodaySessionsForStudent, getSessionsForStudent, getClass } from "@/mockData";
import { User, Clock, ChevronRight } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

export default function ParentDashboard() {
  const { currentUser } = useAuth();
  const { getByLearner } = useAttendance();
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];

  return (
    <div className="page-container">
      <h1 className="page-title">Parent Dashboard</h1>
      <p className="page-subtitle">Welcome, {currentUser?.name}</p>

      <div className="grid gap-6 md:grid-cols-2">
        {childIds.map((childId) => {
          const learner = getLearner(childId);
          if (!learner) return null;
          const todaySessions = getTodaySessionsForStudent(childId);

          return (
            <div key={childId} className="bg-card rounded-xl border p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{learner.firstName} {learner.lastName}</p>
                    <p className="text-xs text-muted-foreground">{learner.school}</p>
                  </div>
                </div>
                <Link
                  to={`/parent/children/${childId}`}
                  className="shrink-0 text-sm text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  View profile <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Attendance summary from real data */}
              <div className="p-3 rounded-lg bg-muted/50 mb-3">
                <AttendanceSummaryLine learnerId={childId} getByLearner={getByLearner} />
              </div>

              {/* Today's sessions */}
              <h3 className="font-medium text-sm flex items-center gap-1 mb-2">
                <Clock className="w-4 h-4 text-accent" /> Today&apos;s Sessions
              </h3>
              {todaySessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sessions today.</p>
              ) : (
                <div className="space-y-2">
                  {todaySessions.map((s) => {
                    const cls = getClass(s.classId);
                    return (
                      <div key={s.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <span className="font-medium">{cls?.name}</span> · {s.startTime} – {s.endTime}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {childIds.length === 0 && (
          <p className="text-muted-foreground">No children linked to your account.</p>
        )}
      </div>
    </div>
  );
}

function AttendanceSummaryLine({
  learnerId,
  getByLearner,
}: {
  learnerId: string;
  getByLearner: (learnerId: string) => { sessionId: string; status: string }[];
}) {
  const { total, attended } = useMemo(() => {
    const records = getByLearner(learnerId);
    const sessions = getSessionsForStudent(learnerId).filter((s) => s.date <= today);
    const sessionIds = new Set(sessions.map((s) => s.id));
    const totalSessions = sessionIds.size;
    const attendedCount = records.filter(
      (r) => sessionIds.has(r.sessionId) && (r.status === "present" || r.status === "late")
    ).length;
    return { total: totalSessions, attended: attendedCount };
  }, [learnerId, getByLearner]);

  if (total === 0) {
    return <p className="text-sm font-medium text-muted-foreground">No sessions yet.</p>;
  }
  const pct = Math.round((attended / total) * 100);
  return (
    <>
      <p className="text-sm font-medium">Attendance: {attended}/{total} sessions</p>
      <div className="w-full h-2 bg-muted rounded-full mt-1">
        <div
          className="h-2 bg-green-500 dark:bg-green-600 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </>
  );
}

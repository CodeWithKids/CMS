import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import { parentChildMap, getLearner, getTodaySessionsForStudent, getSessionsForStudent, getClass, getInvoicesForParent } from "@/mockData";
import { User, Clock, ChevronRight, FileText } from "lucide-react";
import { RoleResponsibilitiesCard } from "@/components/RoleResponsibilitiesCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, attendanceGet } from "@/lib/api";

const today = new Date().toISOString().split("T")[0];

export default function ParentDashboard() {
  const { currentUser } = useAuth();
  const { getByLearner } = useAttendance();
  const { getInvoices } = useFinanceAccount();
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];
  const invoices = getInvoicesForParent(getInvoices(), childIds);
  const outstandingCount = invoices.filter(
    (i) => i.status !== "paid" && i.status !== "draft"
  ).length;

  return (
    <div className="page-container">
      <h1 className="page-title">Parent Dashboard</h1>
      <p className="page-subtitle">Welcome, {currentUser?.name}</p>

      <div className="mb-6">
        <RoleResponsibilitiesCard />
      </div>

      {outstandingCount > 0 && (
        <Card className="mb-6 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Outstanding invoices</p>
                  <p className="text-sm text-muted-foreground">
                    {outstandingCount} invoice{outstandingCount !== 1 ? "s" : ""} need your attention.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/parent/invoices">View invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
  const sessions = useMemo(
    () => getSessionsForStudent(learnerId).filter((s) => s.date <= today),
    [learnerId]
  );
  const apiEnabled = isApiEnabled();
  const { data: apiRecords = [], isLoading } = useQuery({
    queryKey: ["parent", "attendance", learnerId, sessions.map((s) => s.id).join(",")],
    queryFn: async () => {
      const all = await Promise.all(
        sessions.map((s) => attendanceGet(s.id))
      );
      return all.flat().filter((r) => r.learnerId === learnerId);
    },
    enabled: apiEnabled && sessions.length > 0,
  });

  const { total, attended } = useMemo(() => {
    const records = apiEnabled ? apiRecords : getByLearner(learnerId);
    const sessionIds = new Set(sessions.map((s) => s.id));
    const totalSessions = sessionIds.size;
    const attendedCount = records.filter(
      (r) =>
        sessionIds.has(r.sessionId) &&
        (r.status === "present" || r.status === "late")
    ).length;
    return { total: totalSessions, attended: attendedCount };
  }, [apiEnabled, apiRecords, getByLearner, learnerId, sessions]);

  if (total === 0) {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        {isLoading && apiEnabled ? "Loading attendance…" : "No sessions yet."}
      </p>
    );
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

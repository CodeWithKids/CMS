import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getClass,
  getTerm,
  mockTerms,
  getLearner,
  getEducatorName,
  DEFAULT_TERM_ID,
} from "@/mockData";
import { useAuth } from "@/context/AuthContext";
import { useSessions } from "@/context/SessionsContext";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useSessionExpenses } from "@/context/SessionExpensesContext";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { getSessionRoleForUser, canEditSession } from "@/features/educator/lib/auth";
import { AddCoachDialog } from "@/features/educator/components/AddCoachDialog";
import { LEARNING_TRACK_LABELS } from "@/types";
import { ArrowLeft, Calendar, ClipboardList, Users, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getSessionsForClass } = useSessions();
  const [termId, setTermId] = useState(DEFAULT_TERM_ID);
  const [coachDialogSession, setCoachDialogSession] = useState<string | null>(null);
  const cls = getClass(id ?? "");
  const sessions = getSessionsForClass(id ?? "");
  const { getBySession } = useAttendance();
  const { getEnrollmentsForClass } = useEnrollments();
  const { getBySession: getReportBySession } = useSessionReports();
  const { getExpenseBySessionAndEducator } = useSessionExpenses();
  const { getInstanceForSession } = useLessonPlans();
  const educatorId = currentUser?.id ?? "";
  const term = getTerm(termId);
  const enrollmentsThisTerm = cls ? getEnrollmentsForClass(cls.id, termId) : [];
  const activeLearnerIdsThisTerm = enrollmentsThisTerm.filter((e) => e.status === "active").map((e) => e.learnerId);
  const totalLearners = activeLearnerIdsThisTerm.length;
  const sessionStats = sessions.map((s) => {
    const records = getBySession(s.id);
    const present = records.filter((r) => r.status === "present" || r.status === "late").length;
    const pct = totalLearners > 0 ? Math.round((present / totalLearners) * 100) : 0;
    return { session: s, present, total: totalLearners, pct, hasData: records.length > 0 };
  });
  const avgPct = sessionStats.length > 0
    ? Math.round(sessionStats.reduce((a, x) => a + x.pct, 0) / sessionStats.length)
    : null;
  const lowSessions = sessionStats.filter((x) => x.total > 0 && x.pct < 70 && x.hasData);

  if (!cls) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Class not found.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/educator/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="bg-card rounded-xl border p-5 mb-6">
        <h1 className="text-xl font-bold">{cls.name}</h1>
        <p className="text-sm text-muted-foreground">{cls.program} · {cls.ageGroup} · {cls.location}</p>
        <p className="text-sm text-muted-foreground mt-1">{activeLearnerIdsThisTerm.length} learners this term</p>
      </div>

      <div className="bg-card rounded-xl border p-5 mb-6">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" /> Enrolment by term
        </h2>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">Term:</span>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockTerms.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {activeLearnerIdsThisTerm.length} active this term · {enrollmentsThisTerm.filter((e) => e.status !== "active").length} dropped/completed
        </p>
        <ul className="divide-y divide-border rounded-md border">
          {enrollmentsThisTerm.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No enrolments for this term.</li>
          ) : (
            enrollmentsThisTerm.map((e) => {
              const learner = getLearner(e.learnerId);
              const name = learner ? `${learner.firstName} ${learner.lastName}` : e.learnerId;
              return (
                <li key={e.id} className="px-3 py-2 flex items-center justify-between text-sm">
                  <span>{name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      e.status === "active"
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : e.status === "completed"
                          ? "bg-muted text-muted-foreground"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {e.status}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {avgPct !== null && (
        <div className="bg-card rounded-xl border p-5 mb-6">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-primary" /> Attendance
          </h2>
          <p className="text-sm text-muted-foreground">
            Average attendance: <span className="font-medium text-foreground">{avgPct}%</span>
            {sessionStats.some((x) => x.hasData) && ` across ${sessionStats.filter((x) => x.hasData).length} session(s) with data`}.
          </p>
          {lowSessions.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Low attendance (&lt;70%): {lowSessions.map((x) => `${x.session.date} (${x.pct}%)`).join(", ")}
            </p>
          )}
        </div>
      )}

      <h2 className="font-semibold flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" /> Sessions
      </h2>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Topic</th>
              <th>Track</th>
              <th>Your role</th>
              <th>Coaches</th>
              <th>Lesson plan</th>
              <th>Attendance</th>
              <th>Report</th>
              <th>Expenses</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const role = getSessionRoleForUser(s, currentUser);
              const canEdit = canEditSession(s, currentUser);
              const lpStatus = getInstanceForSession(s.id)?.status ?? "not_started";
              const reportStatus = getReportBySession(s.id)?.status;
              const hasExpense = getExpenseBySessionAndEducator(s.id, educatorId);
              const attCount = getBySession(s.id).length;
              const coachIds = s.assistantEducatorIds ?? [];
              return (
                <tr key={s.id}>
                  <td>{s.date}</td>
                  <td>{s.startTime} – {s.endTime}</td>
                  <td>{s.topic}</td>
                  <td className="text-muted-foreground">{LEARNING_TRACK_LABELS[s.learningTrack] ?? s.learningTrack}</td>
                  <td>
                    {role ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${role === "facilitator" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {role === "facilitator" ? "Facilitator" : "Coach"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1">
                      {coachIds.map((cid) => (
                        <span key={cid} className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                          {getEducatorName(cid)}
                        </span>
                      ))}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setCoachDialogSession(s.id)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {coachIds.length > 0 ? "Manage" : "Add coach"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">{lpStatus === "ready" ? "Ready" : lpStatus === "draft" ? "Draft" : "Pending"}</span>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">{attCount > 0 ? "Done" : "Pending"}</span>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">{reportStatus === "submitted" ? "Submitted" : "Pending"}</span>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">{hasExpense ? "Logged" : "Pending"}</span>
                  </td>
                  <td>
                    <Link to={`/educator/sessions/${s.id}/lesson-plan`} className="text-sm text-primary hover:underline font-medium mr-2">
                      Plan
                    </Link>
                    <Link to={`/educator/sessions/${s.id}/attendance`} className="text-sm text-primary hover:underline font-medium mr-2">
                      Attendance
                    </Link>
                    <Link to={`/educator/sessions/${s.id}/report`} className="text-sm text-primary hover:underline font-medium mr-2">
                      Report
                    </Link>
                    <Link to={`/educator/sessions/${s.id}/expenses`} className="text-sm text-primary hover:underline font-medium">
                      Expenses
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sessions.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">No sessions scheduled for this class.</p>
      )}

      {coachDialogSession && (() => {
        const session = sessions.find((s) => s.id === coachDialogSession);
        if (!session) return null;
        return (
          <AddCoachDialog
            session={session}
            open={!!coachDialogSession}
            onOpenChange={(o) => !o && setCoachDialogSession(null)}
          />
        );
      })()}
    </div>
  );
}

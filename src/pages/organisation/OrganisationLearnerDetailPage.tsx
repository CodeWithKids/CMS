import { useParams, Link } from "react-router-dom";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { getLearnerForOrganisation, getSession, getTerm, getClass, getCurrentTerm, getSessionsForTerm } from "@/mockData";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import { ArrowLeft, User, ClipboardList, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrganisationLearnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { organizationId, isOrgUser } = useOrganisationLearners();
  // Fetch by id and organizationId so we never show another org's learner
  const learner = getLearnerForOrganisation(id ?? "", organizationId);

  const { getEnrollmentsForLearner } = useEnrollments();
  const { getByLearner } = useAttendance();
  const { getByLearner: getBadgeAwardsByLearner } = useBadgeAwards();

  const attendanceRecords = id ? getByLearner(id) : [];
  const currentTerm = getCurrentTerm();
  const currentTermSessionIds = currentTerm ? new Set(getSessionsForTerm(currentTerm.id).map((s) => s.id)) : new Set<string>();
  const currentTermRecords = id ? attendanceRecords.filter((r) => currentTermSessionIds.has(r.sessionId)) : [];
  const presentCount = currentTermRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const totalSessions = currentTermRecords.length;
  const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  const badgeAwards = id ? getBadgeAwardsByLearner(id) : [];
  const badgeSummary = (() => {
    const byType: Record<string, number> = {};
    for (const a of badgeAwards) {
      byType[a.badgeId] = (byType[a.badgeId] ?? 0) + 1;
    }
    return { totalBadges: badgeAwards.length, byType };
  })();

  const enrollmentHistory = id ? getEnrollmentsForLearner(id) : [];
  const enrollmentWithDetails = enrollmentHistory
    .map((e) => ({ enrollment: e, term: getTerm(e.termId), cls: getClass(e.classId) }))
    .filter((x): x is { enrollment: typeof x.enrollment; term: NonNullable<typeof x.term>; cls: NonNullable<typeof x.cls> } => !!x.term && !!x.cls)
    .sort((a, b) => a.term.startDate.localeCompare(b.term.startDate));

  const withSession = attendanceRecords
    .map((r) => ({ record: r, session: getSession(r.sessionId) }))
    .filter((x): x is { record: typeof x.record; session: NonNullable<typeof x.session> } => !!x.session)
    .sort((a, b) => (b.session.date > a.session.date ? 1 : -1));

  if (!isOrgUser) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  if (!learner) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Learner not found or not linked to your organisation.</p>
        <Link to="/organisation/learners" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to learners
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link
        to="/organisation/learners"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to learners
      </Link>

      <div className="bg-card rounded-xl border p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{learner.firstName} {learner.lastName}</h1>
            <p className="text-sm text-muted-foreground">{learner.school} · Born {learner.dateOfBirth}</p>
            <Badge variant={learner.status === "active" ? "default" : "secondary"} className="mt-2">
              {learner.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Badges</h3>
            <p className="text-lg font-semibold">Badges earned: {badgeSummary.totalBadges}</p>
            {badgeSummary.totalBadges > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(badgeSummary.byType)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([badgeId, count]) => {
                    const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
                    return (
                      <Badge key={badgeId} variant="secondary" className="text-xs font-normal">
                        {def?.label ?? badgeId} ×{count}
                      </Badge>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Attendance</h3>
            {totalSessions > 0 ? (
              <>
                <p className="text-lg font-semibold">{attendancePercentage}% attendance</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {presentCount} of {totalSessions} sessions this term
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No attendance data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-primary" /> Enrolment history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollmentWithDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrolment records yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {enrollmentWithDetails.map(({ enrollment, term, cls }) => (
                <li key={enrollment.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <span><span className="font-medium">{term.name}</span> · {cls.name}</span>
                  <Badge variant="secondary" className="text-xs">{enrollment.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-5 h-5 text-primary" /> Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {withSession.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {withSession.slice(0, 20).map(({ record, session }) => (
                <li
                  key={`${record.sessionId}-${record.learnerId}`}
                  className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm">{session.date}</span>
                  <span className="text-sm font-medium capitalize">{record.status}</span>
                </li>
              ))}
            </ul>
          )}
          {withSession.length > 20 && (
            <p className="text-xs text-muted-foreground mt-2">Showing latest 20 of {withSession.length}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

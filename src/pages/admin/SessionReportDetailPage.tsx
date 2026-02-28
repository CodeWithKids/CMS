import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import { getSession, getClass, getEducatorName } from "@/mockData";
import {
  buildSessionReportSummary,
  buildSessionReportDetailView,
} from "@/lib/sessionReportAdmin";
import type { Session } from "@/types";
import {
  toSessionReportSessionTypeAdmin,
  SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS,
  SESSION_REPORT_STATUS_ADMIN_LABELS,
} from "@/types";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, Send } from "lucide-react";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import { useToast } from "@/hooks/use-toast";

function presentCountForSession(
  sessionId: string,
  getBySession: (id: string) => { status: string }[]
): number {
  const records = getBySession(sessionId);
  return records.filter((r) => r.status === "present" || r.status === "late").length;
}

function starsForSession(
  sessionId: string,
  getBySession: (id: string) => { stars?: number }[]
): number {
  const records = getBySession(sessionId);
  return records.reduce((sum, r) => sum + (r.stars ?? 0), 0);
}

function MissingReportView({
  sessionFromMissing,
  cls,
  getAttendanceBySession,
  getEducatorName,
}: {
  sessionFromMissing: Session;
  cls: { name: string } | null;
  getAttendanceBySession: (id: string) => { status: string }[];
  getEducatorName: (id: string) => string;
}) {
  const { toast } = useToast();
  const [reminderOpen, setReminderOpen] = useState(false);
  const present = presentCountForSession(sessionFromMissing.id, getAttendanceBySession);
  const sessionTypeAdmin = toSessionReportSessionTypeAdmin(sessionFromMissing.sessionType);
  const summary = {
    sessionDate: sessionFromMissing.date,
    sessionTypeLabel: SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS[sessionTypeAdmin],
    organisationName: "—",
    className: cls?.name ?? sessionFromMissing.classId,
    leadEducatorName: getEducatorName(sessionFromMissing.leadEducatorId),
    presentCount: present,
    totalLearners: 0,
    engagementRating: null,
    status: "MISSING" as const,
  };

  const handleConfirmReminder = () => {
    toast({
      title: "Reminder sent",
      description: `A reminder to submit the session report has been sent to ${summary.leadEducatorName}.`,
    });
    setReminderOpen(false);
  };

  return (
    <div className="page-container max-w-3xl">
      <Link
        to="/admin/session-reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to session reports
      </Link>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Session report — missing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            <span><strong>Date:</strong> {summary.sessionDate}</span>
            <span><strong>Type:</strong> {summary.sessionTypeLabel}</span>
            <span><strong>Organisation:</strong> {summary.organisationName}</span>
            <span><strong>Class:</strong> {summary.className}</span>
            <span><strong>Lead educator:</strong> {summary.leadEducatorName}</span>
            <span><strong>Attendance:</strong> {summary.presentCount} / —</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400">
              {SESSION_REPORT_STATUS_ADMIN_LABELS.MISSING}
            </span>
          </div>
          <p className="text-muted-foreground mt-3">
            This session does not have a submitted report yet.
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setReminderOpen(true)}
          >
            <Send className="w-4 h-4" />
            Send reminder to {summary.leadEducatorName}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Send a reminder to {summary.leadEducatorName} to submit the session report? They will receive an email or in-app notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReminder}>
              Send reminder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SessionReportDetailPage() {
  const { id: reportId } = useParams<{ id: string }>();
  const { getReportById } = useSessionReports();
  const { getBySession: getAttendanceBySession } = useAttendance();
  const { getBySession: getBadgeAwardsBySession } = useBadgeAwards();

  const isMissing = reportId?.startsWith("missing-") ?? false;
  const sessionIdFromMissing = isMissing ? reportId!.replace("missing-", "") : null;

  const report = reportId && !isMissing ? getReportById(reportId) : undefined;
  const sessionFromReport = report ? getSession(report.sessionId) : null;
  const sessionFromMissing =
    sessionIdFromMissing ? getSession(sessionIdFromMissing) : null;
  const session = sessionFromReport ?? sessionFromMissing;
  const cls = session ? getClass(session.classId) : null;

  const detailView = useMemo(() => {
    if (!report || !session) return null;
    const present = presentCountForSession(report.sessionId, getAttendanceBySession);
    const stars = starsForSession(report.sessionId, getAttendanceBySession);
    const summary = buildSessionReportSummary(
      report,
      getSession,
      getClass,
      getEducatorName,
      present
    );
    return buildSessionReportDetailView(
      summary,
      report,
      getBadgeAwardsBySession,
      stars
    );
  }, [
    report,
    session,
    getAttendanceBySession,
    getBadgeAwardsBySession,
  ]);

  if (isMissing && sessionFromMissing) {
    return (
      <MissingReportView
        sessionFromMissing={sessionFromMissing}
        cls={cls}
        getAttendanceBySession={getAttendanceBySession}
        getEducatorName={getEducatorName}
      />
    );
  }

  if (!report) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Report not found.</p>
        <Link to="/admin/session-reports" className="text-primary hover:underline text-sm">
          ← Back to session reports
        </Link>
      </div>
    );
  }

  if (!detailView) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Loading report…</p>
        <Link to="/admin/session-reports" className="text-primary hover:underline text-sm">
          ← Back to session reports
        </Link>
      </div>
    );
  }

  const badgeLabel = (badgeId: string) =>
    BADGE_DEFINITIONS.find((b) => b.id === badgeId)?.label ?? badgeId;

  return (
    <div className="page-container max-w-3xl">
      <PageBreadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Session reports", href: "/admin/session-reports" },
          { label: `Report ${detailView.sessionDate}` },
        ]}
        className="mb-4"
      />
      <Link
        to="/admin/session-reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to session reports
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Session report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <span><strong>Date:</strong> {detailView.sessionDate}</span>
            <span><strong>Type:</strong> {SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS[detailView.sessionType]}</span>
            <span><strong>Organisation:</strong> {detailView.organisationName}</span>
            <span><strong>Class:</strong> {detailView.className}</span>
            <span><strong>Lead educator:</strong> {detailView.leadEducatorName}</span>
            <span><strong>Attendance:</strong> {detailView.presentCount} / {detailView.totalLearners}</span>
            <span><strong>Engagement:</strong> {detailView.engagementRating != null ? `${detailView.engagementRating}/5` : "—"}</span>
            <Badge
              variant="secondary"
              className={
                detailView.status === "SUBMITTED"
                  ? "bg-green-500/15 text-green-700 dark:text-green-400"
                  : detailView.status === "FLAGGED"
                    ? "bg-red-500/15 text-red-700 dark:text-red-400"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }
            >
              {SESSION_REPORT_STATUS_ADMIN_LABELS[detailView.status]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {detailView.notes != null && detailView.notes !== "" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{detailView.notes}</CardContent>
          </Card>
        )}

        {detailView.challenges != null && detailView.challenges !== "" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Challenges</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{detailView.challenges}</CardContent>
          </Card>
        )}

        {(detailView.starsGiven != null && detailView.starsGiven > 0) ||
        (detailView.badgesSummary && Object.keys(detailView.badgesSummary).length > 0) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stars & badges summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {detailView.starsGiven != null && detailView.starsGiven > 0 && (
                <p><strong>Stars given this session:</strong> {detailView.starsGiven}</p>
              )}
              {detailView.badgesSummary && Object.keys(detailView.badgesSummary).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(detailView.badgesSummary).map(([badgeId, count]) => (
                    <Badge key={badgeId} variant="secondary" className="font-normal">
                      {badgeLabel(badgeId)} × {count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {detailView.incidents != null && detailView.incidents !== "" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incidents</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{detailView.incidents}</CardContent>
          </Card>
        )}

        {detailView.followUpActions != null && detailView.followUpActions !== "" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Follow-up actions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{detailView.followUpActions}</CardContent>
          </Card>
        )}

        {report.coachFeedback && report.coachFeedback.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coach feedback</CardTitle>
              <CardDescription>Feedback from coaches on this session (visible to admin and lead educator).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.coachFeedback.map((entry) => (
                <div key={`${entry.educatorId}-${entry.createdAt}`} className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-muted-foreground mb-1">{getEducatorName(entry.educatorId)}</p>
                  <p className="whitespace-pre-wrap">{entry.text}</p>
                  {entry.createdAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.createdAt).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

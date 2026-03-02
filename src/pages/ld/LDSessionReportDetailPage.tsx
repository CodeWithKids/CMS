import { useParams, Link } from "react-router-dom";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import { getSession, getClass, getEducatorName } from "@/mockData";
import { buildSessionReportSummary, buildSessionReportDetailView } from "@/lib/sessionReportAdmin";
import { SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS, SESSION_REPORT_STATUS_ADMIN_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText } from "lucide-react";
import { useMemo } from "react";

function presentCountForSession(sessionId: string, getBySession: (id: string) => { status: string }[]): number {
  const records = getBySession(sessionId);
  return records.filter((r) => r.status === "present" || r.status === "late").length;
}
function starsForSession(sessionId: string, getBySession: (id: string) => { stars?: number }[]): number {
  const records = getBySession(sessionId);
  return records.reduce((sum, r) => sum + (r.stars ?? 0), 0);
}

export default function LDSessionReportDetailPage() {
  const { id: reportId } = useParams<{ id: string }>();
  const { getReportById } = useSessionReports();
  const { getBySession: getAttendanceBySession } = useAttendance();
  const { getBySession: getBadgeAwardsBySession } = useBadgeAwards();

  const report = reportId ? getReportById(reportId) : undefined;
  const session = report ? getSession(report.sessionId) : null;
  const cls = session ? getClass(session.classId) : null;

  const detailView = useMemo(() => {
    if (!report || !session) return null;
    const present = presentCountForSession(report.sessionId, getAttendanceBySession);
    const stars = starsForSession(report.sessionId, getAttendanceBySession);
    const summary = buildSessionReportSummary(report, getSession, getClass, getEducatorName, present);
    return buildSessionReportDetailView(summary, report, getBadgeAwardsBySession, stars);
  }, [report, session, getAttendanceBySession, getBadgeAwardsBySession]);

  if (!report) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Report not found.</p>
        <Link to="/ld/session-reports" className="text-primary hover:underline text-sm">← Back to session reports</Link>
      </div>
    );
  }
  if (!detailView) return null;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <Link to="/ld/session-reports" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to session reports
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Session report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <span><strong>Date:</strong> {detailView.sessionDate}</span>
            <span><strong>Type:</strong> {SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS[detailView.sessionType]}</span>
            <span><strong>Class:</strong> {detailView.className}</span>
            <span><strong>Lead educator:</strong> {detailView.leadEducatorName}</span>
            <span><strong>Attendance:</strong> {detailView.presentCount} / {detailView.totalLearners}</span>
            <span><strong>Engagement:</strong> {detailView.engagementRating != null ? `${detailView.engagementRating}/5` : "—"}</span>
            <Badge variant="secondary">{SESSION_REPORT_STATUS_ADMIN_LABELS[detailView.status]}</Badge>
          </div>
          {detailView.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes / highlights</p>
              <p className="text-sm whitespace-pre-wrap">{detailView.notes}</p>
            </div>
          )}
          {detailView.challenges && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Challenges / adjustments</p>
              <p className="text-sm whitespace-pre-wrap">{detailView.challenges}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

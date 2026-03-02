import { Link } from "react-router-dom";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { useLearnerFeedback } from "@/context/LearnerFeedbackContext";
import { getCurrentTerm, getSessionsForTerm, mockStaff, mockSessions } from "@/mockData";
import type { LearningTrack } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, BookOpen, Users, MessageSquare, AlertTriangle, FileText } from "lucide-react";

const educatorIds = mockStaff.filter((s) => s.role === "educator").map((s) => s.id);

export default function LDDashboardPage() {
  const { list: listReports } = useSessionReports();
  const { templates } = useLessonPlans();
  const { feedbacks } = useLearnerFeedback();
  const currentTerm = getCurrentTerm();
  const termId = currentTerm?.id ?? "t1";
  const termSessions = getSessionsForTerm(termId);

  const trackIds = [...new Set(templates.map((t) => t.learningTrackId))];
  const activeTracksCount = trackIds.length;
  const educatorsCount = educatorIds.length;

  const avgFeedback =
    feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
      : null;
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  const thisWeekStr = (d: Date) => d.toISOString().slice(0, 10);
  const sessionsThisWeek = mockSessions.filter(
    (s) => s.date >= thisWeekStr(thisWeekStart) && s.date <= thisWeekStr(thisWeekEnd)
  ).length;

  const reportsWithChallenges = listReports().filter(
    (r) => r.technicalChallenges || r.curriculumAdjustmentsSuggested
  );
  const lowEngagementReports = listReports().filter(
    (r) => r.engagementLevel != null && r.engagementLevel <= 2
  );
  const templatesNeedingReview = templates.filter((t) => !t.title?.trim()).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" /> L&D Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of learning quality and priorities. Curriculum, educator capability, and session quality.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeTracksCount}</p>
            <p className="text-xs text-muted-foreground">Tracks with lesson plan templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Educators supported</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{educatorsCount}</p>
            <p className="text-xs text-muted-foreground">Team you support</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg learner feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgFeedback != null ? avgFeedback.toFixed(1) : "—"}</p>
            <p className="text-xs text-muted-foreground">{feedbacks.length} responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sessionsThisWeek}</p>
            <p className="text-xs text-muted-foreground">Across all tracks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alerts / focus areas</CardTitle>
            <CardDescription>Tracks or sessions that need attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportsWithChallenges.length > 0 && (
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sessions with challenges flagged</AlertTitle>
                <AlertDescription>
                  {reportsWithChallenges.length} session report(s) have technical challenges or curriculum adjustments suggested.
                </AlertDescription>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link to="/ld/reports">View in reports</Link>
                </Button>
              </Alert>
            )}
            {lowEngagementReports.length > 0 && (
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Low engagement reported</AlertTitle>
                <AlertDescription>
                  {lowEngagementReports.length} session(s) with engagement level ≤ 2.
                </AlertDescription>
              </Alert>
            )}
            {templatesNeedingReview === 0 && reportsWithChallenges.length === 0 && lowEngagementReports.length === 0 && (
              <p className="text-sm text-muted-foreground">No alerts. Quality indicators are healthy.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick links</CardTitle>
            <CardDescription>Common L&D actions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/ld/lesson-plans">
                <BookOpen className="w-4 h-4 mr-2" />
                Review lesson plan library
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/ld/coaching">
                <Users className="w-4 h-4 mr-2" />
                View educators to coach this week
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/ld/session-reports">
                <FileText className="w-4 h-4 mr-2" />
                Session reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

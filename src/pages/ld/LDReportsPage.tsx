import { useSessionReports } from "@/context/SessionReportsContext";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { useLearnerFeedback } from "@/context/LearnerFeedbackContext";
import { mockSessions } from "@/mockData";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart2 } from "lucide-react";

export default function LDReportsPage() {
  const { list: listReports } = useSessionReports();
  const { templates } = useLessonPlans();
  const { feedbacks } = useLearnerFeedback();
  const reports = listReports();

  const byTrack = (() => {
    const map = new Map<LearningTrack, { sessions: number; feedbackSum: number; feedbackCount: number; challengeCount: number }>();
    for (const s of mockSessions) {
      const r = reports.find((x) => x.sessionId === s.id);
      const entry = map.get(s.learningTrack) ?? { sessions: 0, feedbackSum: 0, feedbackCount: 0, challengeCount: 0 };
      entry.sessions += 1;
      if (r?.technicalChallenges || r?.curriculumAdjustmentsSuggested) entry.challengeCount += 1;
      map.set(s.learningTrack, entry);
    }
    for (const f of feedbacks) {
      const s = mockSessions.find((x) => x.id === f.sessionId);
      if (!s) continue;
      const entry = map.get(s.learningTrack);
      if (entry) {
        entry.feedbackSum += f.rating;
        entry.feedbackCount += 1;
      }
    }
    return Array.from(map.entries()).map(([trackId, v]) => ({
      trackId,
      name: LEARNING_TRACK_LABELS[trackId] ?? trackId,
      ...v,
      avgFeedback: v.feedbackCount > 0 ? (v.feedbackSum / v.feedbackCount).toFixed(1) : "—",
    }));
  })();

  const templatesByTrack = (() => {
    const map = new Map<LearningTrack, number>();
    for (const t of templates) {
      map.set(t.learningTrackId, (map.get(t.learningTrackId) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([trackId, count]) => ({ trackId, count, name: LEARNING_TRACK_LABELS[trackId] ?? trackId }));
  })();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart2 className="w-6 h-6" /> Learning reports
        </h1>
        <p className="text-muted-foreground">Analytics by track and content health.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By track</CardTitle>
          <CardDescription>Sessions, average feedback, and challenges flagged</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Avg feedback</TableHead>
                <TableHead>Challenges flagged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byTrack.map((row) => (
                <TableRow key={row.trackId}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.sessions}</TableCell>
                  <TableCell>{row.avgFeedback}</TableCell>
                  <TableCell>{row.challengeCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content health</CardTitle>
          <CardDescription>Template usage per track</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Templates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesByTrack.map((row) => (
                <TableRow key={row.trackId}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

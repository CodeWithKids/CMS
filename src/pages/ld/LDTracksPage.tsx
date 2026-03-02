import { Link } from "react-router-dom";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { mockSessions } from "@/mockData";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const TRACK_IDS: LearningTrack[] = ["game_design", "python", "robotics", "computer_basics", "web_design", "ai"];

export default function LDTracksPage() {
  const { templates } = useLessonPlans();
  const trackStats = TRACK_IDS.map((trackId) => {
    const templateCount = templates.filter((t) => t.learningTrackId === trackId).length;
    const classIds = [...new Set(mockSessions.filter((s) => s.learningTrack === trackId).map((s) => s.classId))];
    return { trackId, name: LEARNING_TRACK_LABELS[trackId] ?? trackId, templateCount, activeClassesCount: classIds.length };
  }).filter((t) => t.templateCount > 0 || t.activeClassesCount > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Tracks & curriculum
        </h1>
        <p className="text-muted-foreground">Manage learning tracks. Only L&D and Admin can edit.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Learning tracks</CardTitle>
          <CardDescription>Template count and classes using each track</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Templates</TableHead>
                <TableHead>Active classes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No track data.</TableCell>
                </TableRow>
              ) : (
                trackStats.map((row) => (
                  <TableRow key={row.trackId}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.templateCount}</TableCell>
                    <TableCell>{row.activeClassesCount}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/ld/lesson-plans?track=${row.trackId}`}>Lesson plans</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

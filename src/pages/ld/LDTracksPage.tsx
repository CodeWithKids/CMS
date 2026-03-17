import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { mockSessions } from "@/mockData";
import { isApiEnabled, sessionsGetAll, focusAreasGetAll } from "@/lib/api";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const FALLBACK_TRACK_IDS: LearningTrack[] = [
  "computer_basics", "game_design", "web_design", "app_design", "python", "graphic_design",
  "robotics", "3d_design", "microbit", "physical_computing", "science_experiments",
  "financial_literacy", "ai", "blockchain", "esports",
];

export default function LDTracksPage() {
  const { templates } = useLessonPlans();
  const apiEnabled = isApiEnabled();
  const [focusAreaFilter, setFocusAreaFilter] = useState<string | null>(null);

  const { data: apiSessions = [] } = useQuery({
    queryKey: ["ld", "tracks", "sessions"],
    queryFn: () => sessionsGetAll({}),
    enabled: apiEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: focusAreas = [] } = useQuery({
    queryKey: ["focus-areas"],
    queryFn: focusAreasGetAll,
    enabled: apiEnabled,
    staleTime: 10 * 60 * 1000,
  });

  const sessions = useMemo(
    () => (apiEnabled ? apiSessions : mockSessions),
    [apiEnabled, apiSessions]
  );

  const trackStatsById = useMemo(() => {
    const ids = apiEnabled && focusAreas.length > 0
      ? focusAreas.flatMap((fa) => fa.tracks.map((t) => t.id))
      : FALLBACK_TRACK_IDS;
    const map = new Map<string, { templateCount: number; activeClassesCount: number }>();
    for (const trackId of ids) {
      const templateCount = templates.filter((t) => t.learningTrackId === trackId).length;
      const classIds = [
        ...new Set(
          sessions
            .filter((s) => s.learningTrack === trackId)
            .map((s) => s.classId)
        ),
      ];
      map.set(trackId, { templateCount, activeClassesCount: classIds.length });
    }
    return map;
  }, [apiEnabled, focusAreas, templates, sessions]);

  const filteredFocusAreas = useMemo(
    () =>
      focusAreaFilter
        ? focusAreas.filter((fa) => fa.id === focusAreaFilter)
        : focusAreas,
    [focusAreas, focusAreaFilter]
  );

  const hasFocusAreas = apiEnabled && focusAreas.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Tracks & curriculum
        </h1>
        <p className="text-muted-foreground">Manage learning tracks. Only L&D and Admin can edit.</p>
      </div>

      {hasFocusAreas && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={focusAreaFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFocusAreaFilter(null)}
          >
            All
          </Button>
          {focusAreas.map((fa) => (
            <Button
              key={fa.id}
              variant={focusAreaFilter === fa.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFocusAreaFilter(fa.id)}
            >
              {fa.name}
            </Button>
          ))}
        </div>
      )}

      {hasFocusAreas ? (
        <div className="space-y-6">
          {filteredFocusAreas.map((fa) => (
            <Card key={fa.id}>
              <CardHeader>
                <CardTitle>{fa.name}</CardTitle>
                <CardDescription>Tracks in this focus area</CardDescription>
              </CardHeader>
              <CardContent>
                <TrackTable
                  tracks={fa.tracks}
                  trackStatsById={trackStatsById}
                  getTrackName={(t) => t.name}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Learning tracks</CardTitle>
            <CardDescription>Template count and classes using each track</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackTable
              tracks={FALLBACK_TRACK_IDS.map((id) => ({
                id,
                name: LEARNING_TRACK_LABELS[id] ?? id,
                slug: id,
                focusAreaId: "",
                order: 0,
              }))}
              trackStatsById={trackStatsById}
              getTrackName={(t) => t.name}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrackTable({
  tracks,
  trackStatsById,
  getTrackName,
}: {
  tracks: Array<{ id: string; name: string; slug: string; focusAreaId: string; order: number }>;
  trackStatsById: Map<string, { templateCount: number; activeClassesCount: number }>;
  getTrackName: (t: { id: string; name: string }) => string;
}) {
  const rows = tracks.map((t) => {
    const stats = trackStatsById.get(t.id) ?? { templateCount: 0, activeClassesCount: 0 };
    return { track: t, ...stats };
  });

  return (
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
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              No tracks in this focus area.
            </TableCell>
          </TableRow>
        ) : (
          rows.map(({ track, templateCount, activeClassesCount }) => (
            <TableRow key={track.id}>
              <TableCell className="font-medium">{getTrackName(track)}</TableCell>
              <TableCell>{templateCount}</TableCell>
              <TableCell>{activeClassesCount}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/ld/lesson-plans?track=${track.id}`}>Lesson plans</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

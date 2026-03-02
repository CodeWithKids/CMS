import { useAuth } from "@/context/AuthContext";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserCircle, BookOpen, GraduationCap, Star, Sparkles } from "lucide-react";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";

/** Mock L&D ratings (replace with real feedback/aggregates when backend exists). */
const MOCK_LD_RATINGS = [
  { label: "Curriculum quality", score: 4.6, description: "Based on educator and learner feedback" },
  { label: "Educator support", score: 4.8, description: "Training and coaching effectiveness" },
  { label: "Template usefulness", score: 4.5, description: "Lesson plan adoption and ease of use" },
  { label: "Content relevance", score: 4.7, description: "Alignment with learning outcomes" },
] as const;

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  const full = Math.min(Math.floor(score), max);
  const empty = max - full;
  return (
    <div className="flex items-center gap-0.5" title={`${score.toFixed(1)} / ${max}`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="h-4 w-4 fill-amber-500 text-amber-500 shrink-0" />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      ))}
      <span className="ml-2 text-sm font-medium tabular-nums text-foreground">{score.toFixed(1)}</span>
    </div>
  );
}

export default function LDProfilePage() {
  const { currentUser } = useAuth();
  const { templates } = useLessonPlans();
  const trackIds = [...new Set(templates.map((t) => t.learningTrackId).filter(Boolean))] as LearningTrack[];

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="page-container p-6 space-y-8 max-w-4xl">
      {/* Hero / identity */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="h-20 w-20 rounded-xl border-4 border-background shadow-lg shrink-0">
            <AvatarFallback className="rounded-xl text-2xl font-semibold bg-primary/15 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <UserCircle className="w-7 h-7 text-primary shrink-0" />
                {currentUser.name}
              </h1>
              <Badge variant="secondary" className="font-medium bg-primary/10 text-primary border-primary/20">
                L&D Manager
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Learning & Development Manager — curriculum, educator growth, and programme quality
            </p>
            {currentUser.email && (
              <p className="text-sm text-muted-foreground truncate">{currentUser.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Lesson plan templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{trackIds.length}</p>
                <p className="text-sm text-muted-foreground">Tracks with content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {(MOCK_LD_RATINGS.reduce((a, r) => a + r.score, 0) / MOCK_LD_RATINGS.length).toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Average rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Your ratings
          </CardTitle>
          <CardDescription>
            Quality and impact metrics. Based on educator feedback and template usage (mock data for now).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {MOCK_LD_RATINGS.map((r) => (
            <div key={r.label} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-sm">{r.label}</span>
                <StarRating score={r.score} />
              </div>
              <Progress value={(r.score / 5) * 100} className="h-2" />
              {r.description && (
                <p className="text-xs text-muted-foreground">{r.description}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tracks you own */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Tracks you own
          </CardTitle>
          <CardDescription>
            Curriculum and quality responsibility for these learning tracks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trackIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tracks with templates yet. Create templates in the Lesson plan library.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trackIds.map((id) => (
                <Badge
                  key={id}
                  variant="secondary"
                  className="py-2 px-3 font-normal bg-primary/5 text-primary border-primary/10"
                >
                  {LEARNING_TRACK_LABELS[id] ?? id}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact summary */}
      <Card className="bg-muted/30 border-muted">
        <CardHeader>
          <CardTitle>Impact at a glance</CardTitle>
          <CardDescription>Your contribution to curriculum and educator development</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-3xl font-bold text-primary">{templates.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Lesson plan templates in the library</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-3xl font-bold text-primary">{trackIds.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Learning tracks with content</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            As L&D Manager you design and maintain learning tracks, support educators with training and coaching,
            and ensure session quality across programmes. Ratings above are placeholders until linked to real feedback.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useCanvasState } from "./CanvasStateContext";
import { RequireMarketingAccess } from "./RequireMarketingAccess";
import { LayoutDashboard, Target, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MOMENT_LABELS: Record<string, string> = {
  ACQUISITION: "Acquisition",
  RETENTION: "Retention",
  GROWTH: "Growth",
  ADVOCACY: "Advocacy",
};

function useCurrentFocusStage(): number {
  const { initiatives } = useCanvasState();
  const byStage: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  initiatives.forEach((i) => {
    if (i.status === "RUNNING" || i.status === "SCALED") byStage[i.stageId]++;
  });
  const entries = Object.entries(byStage) as [string, number][];
  const max = Math.max(...entries.map(([, c]) => c), 0);
  const stage = entries.find(([, c]) => c === max)?.[0];
  return stage ? Number(stage) : 1;
}

function OverviewContent() {
  const { initiatives, stages } = useCanvasState();
  const focusStage = useCurrentFocusStage();

  const total = initiatives.length;
  const planning = initiatives.filter((i) => i.status === "PLANNING").length;
  const running = initiatives.filter((i) => i.status === "RUNNING").length;
  const scaled = initiatives.filter((i) => i.status === "SCALED").length;

  const byMoment = {
    ACQUISITION: initiatives.filter((i) => i.moment === "ACQUISITION"),
    RETENTION: initiatives.filter((i) => i.moment === "RETENTION"),
    GROWTH: initiatives.filter((i) => i.moment === "GROWTH"),
    ADVOCACY: initiatives.filter((i) => i.moment === "ADVOCACY"),
  };

  const upcoming = initiatives
    .filter((i) => i.status === "PLANNING")
    .sort((a, b) => a.stageId - b.stageId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Marketing & Strategy</h1>
        <p className="text-muted-foreground">
          Overview of the AI Marketing Canvas: stages, moments, and upcoming work.
        </p>
      </div>

      {/* Current focus + quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current focus stage</p>
                <p className="text-lg font-semibold">Stage {focusStage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total initiatives</p>
                <p className="text-lg font-semibold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In planning</p>
                <p className="text-lg font-semibold">{planning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running / Scaled</p>
                <p className="text-lg font-semibold">{running + scaled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By moment */}
      <div>
        <h2 className="text-lg font-semibold mb-3">By moment</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(byMoment) as (keyof typeof byMoment)[]).map((moment) => {
            const list = byMoment[moment];
            const priority = list.filter((i) => i.status !== "NOT_STARTED").slice(0, 2);
            return (
              <Card key={moment}>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {MOMENT_LABELS[moment]}
                  </p>
                  <p className="text-2xl font-bold mb-3">{list.length} initiatives</p>
                  <ul className="space-y-1.5 text-sm">
                    {priority.length === 0 ? (
                      <li className="text-muted-foreground">None in progress yet</li>
                    ) : (
                      priority.map((i) => (
                        <li key={i.id} className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {i.status}
                          </Badge>
                          <span className="truncate">{i.title}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upcoming work */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Upcoming work</h2>
        <Card>
          <CardContent className="pt-6">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">No initiatives in planning.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{i.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Stage {i.stageId} · Suggested Q{Math.min(i.stageId + 1, 4)}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/ai-marketing/canvas?stage=${i.stageId}`}>Open</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link to="/ai-marketing/canvas">Open canvas</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/ai-marketing/experiments">Experiments board</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AiMarketingOverviewPage() {
  return (
    <RequireMarketingAccess>
      <OverviewContent />
    </RequireMarketingAccess>
  );
}

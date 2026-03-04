import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCanvasState } from "./CanvasStateContext";
import { useAuth } from "@/context/AuthContext";
import { RequireMarketingAccess } from "./RequireMarketingAccess";
import { canEditAiMarketing } from "./permissions";
import type { CanvasStage, ExperimentStatus, MarketingMoment } from "./canvasConfig";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink } from "lucide-react";

const MOMENT_LABELS: Record<MarketingMoment, string> = {
  ACQUISITION: "Acquisition",
  RETENTION: "Retention",
  GROWTH: "Growth",
  ADVOCACY: "Advocacy",
};

const STATUS_OPTIONS: ExperimentStatus[] = [
  "NOT_STARTED",
  "PLANNING",
  "RUNNING",
  "SCALED",
];

const statusVariant: Record<ExperimentStatus, "secondary" | "default" | "outline"> = {
  NOT_STARTED: "secondary",
  PLANNING: "outline",
  RUNNING: "default",
  SCALED: "default",
};

function InitiativeRow({
  initiative,
  stageId,
  canEdit,
  onStatusChange,
}: {
  initiative: { id: string; title: string; description: string; moment: MarketingMoment; status: ExperimentStatus; linkPath?: string };
  stageId: number;
  canEdit: boolean;
  onStatusChange: (id: string, status: ExperimentStatus) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{initiative.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{initiative.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge variant="outline" className="text-xs">
            {MOMENT_LABELS[initiative.moment]}
          </Badge>
          {canEdit ? (
            <Select
              value={initiative.status}
              onValueChange={(v) => onStatusChange(initiative.id, v as ExperimentStatus)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={statusVariant[initiative.status]}>{initiative.status.replace("_", " ")}</Badge>
          )}
        </div>
      </div>
      {initiative.linkPath && (
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to={initiative.linkPath} target="_blank" rel="noopener noreferrer">
            Go to feature <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function CanvasContent() {
  const { currentUser } = useAuth();
  const { stages, setInitiativeStatus } = useCanvasState();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get("stage");
  const [selectedStageId, setSelectedStageId] = useState<number | null>(() =>
    stageParam ? Math.min(5, Math.max(1, parseInt(stageParam, 10))) : null
  );

  useEffect(() => {
    if (stageParam) {
      const n = parseInt(stageParam, 10);
      if (n >= 1 && n <= 5) setSelectedStageId(n);
    }
  }, [stageParam]);

  const canEdit = currentUser ? canEditAiMarketing(currentUser.role) : false;
  const selectedStage: CanvasStage | undefined = selectedStageId
    ? stages.find((s) => s.id === selectedStageId)
    : undefined;

  const handleStageClick = (id: number) => {
    setSelectedStageId(id);
    setSearchParams({ stage: String(id) });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Marketing Canvas</h1>
        <p className="text-muted-foreground">
          Five stages from Foundation to Monetization. Click a stage to see initiatives and key questions.
        </p>
      </div>

      {/* Stage cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => {
          const runningOrScaled = stage.initiatives.filter(
            (i) => i.status === "RUNNING" || i.status === "SCALED"
          ).length;
          const moments = [...new Set(stage.initiatives.map((i) => i.moment))];
          const isSelected = selectedStageId === stage.id;
          return (
            <Card
              key={stage.id}
              className={`cursor-pointer transition-colors hover:border-primary/50 ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleStageClick(stage.id)}
            >
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground">
                  Stage {stage.id}
                </p>
                <h2 className="text-lg font-semibold mt-0.5">{stage.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {stage.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {moments.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">
                      {MOMENT_LABELS[m]}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stage.initiatives.length} initiatives · {runningOrScaled} running/scaled
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected stage: initiatives + key questions */}
      {selectedStage && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-1">
              Stage {selectedStage.id} – {selectedStage.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{selectedStage.description}</p>

            <h3 className="text-sm font-semibold mb-2">Initiatives</h3>
            <div className="divide-y rounded-md border mb-6">
              {selectedStage.initiatives.map((init) => (
                <InitiativeRow
                  key={init.id}
                  initiative={init}
                  stageId={selectedStage.id}
                  canEdit={canEdit}
                  onStatusChange={setInitiativeStatus}
                />
              ))}
            </div>

            <h3 className="text-sm font-semibold mb-2">Key questions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {selectedStage.keyQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline">
        <Link to="/ai-marketing/experiments">View experiments board</Link>
      </Button>
    </div>
  );
}

export default function AiMarketingCanvasPage() {
  return (
    <RequireMarketingAccess>
      <CanvasContent />
    </RequireMarketingAccess>
  );
}

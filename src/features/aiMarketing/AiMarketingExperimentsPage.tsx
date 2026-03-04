import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCanvasState } from "./CanvasStateContext";
import { useAuth } from "@/context/AuthContext";
import { RequireMarketingAccess } from "./RequireMarketingAccess";
import { canEditAiExperiments } from "./permissions";
import type { ExperimentStatus, MarketingMoment, MarketingStageId } from "./canvasConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, LayoutGrid } from "lucide-react";

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

type InitiativeRow = {
  id: string;
  title: string;
  moment: MarketingMoment;
  status: ExperimentStatus;
  stageId: MarketingStageId;
  stageName: string;
  linkPath?: string;
};

function ExperimentsContent() {
  const { currentUser } = useAuth();
  const { initiatives, setInitiativeStatus } = useCanvasState();
  const navigate = useNavigate();
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterMoment, setFilterMoment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const canEdit = currentUser ? canEditAiExperiments(currentUser.role) : false;

  const filtered = useMemo(() => {
    return initiatives.filter((i) => {
      if (filterStage !== "all" && i.stageId !== Number(filterStage)) return false;
      if (filterMoment !== "all" && i.moment !== filterMoment) return false;
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      return true;
    });
  }, [initiatives, filterStage, filterMoment, filterStatus]);

  const openInCanvas = (stageId: number) => {
    navigate(`/ai-marketing/canvas?stage=${stageId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Experiments board</h1>
        <p className="text-muted-foreground">
          All initiatives across stages. Filter by stage, moment, or status.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Stage</span>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Stage {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Moment</span>
          <Select value={filterMoment} onValueChange={setFilterMoment}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All moments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All moments</SelectItem>
              {(Object.keys(MOMENT_LABELS) as MarketingMoment[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {MOMENT_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>Initiative</TableHead>
              <TableHead>Moment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No initiatives match the filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row: InitiativeRow) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge variant="outline">Stage {row.stageId}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{MOMENT_LABELS[row.moment]}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select
                        value={row.status}
                        onValueChange={(v) => setInitiativeStatus(row.id, v as ExperimentStatus)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
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
                      <Badge variant={statusVariant[row.status]}>
                        {row.status.replace("_", " ")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInCanvas(row.stageId)}
                      >
                        <LayoutGrid className="w-4 h-4 mr-1" />
                        Open in Canvas
                      </Button>
                      {row.linkPath && (
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            to={row.linkPath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Go to feature <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button asChild variant="outline">
        <Link to="/ai-marketing/canvas">Back to canvas</Link>
      </Button>
    </div>
  );
}

export default function AiMarketingExperimentsPage() {
  return (
    <RequireMarketingAccess>
      <ExperimentsContent />
    </RequireMarketingAccess>
  );
}

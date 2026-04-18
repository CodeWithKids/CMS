import { useEffect, useMemo, useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useSessions } from "@/context/SessionsContext";
import { useLearners } from "@/hooks/useLearners";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ClipboardList, FileText } from "lucide-react";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { SessionReport } from "@/types";

function formatSessionDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return dateStr;
  }
}

function isPresentStatus(status: string): boolean {
  return status === "present" || status === "late";
}

export type PartnerAttendanceReportsCardProps = {
  /** Learner ids to scope (e.g. org-linked learners or all children for a parent). */
  learnerIds: string[];
  title?: string;
  description?: string;
};

export function PartnerAttendanceReportsCard({
  learnerIds,
  title = "Attendance & session reports",
  description = "Sessions where your learners are enrolled, who was present, and submitted session reports when available.",
}: PartnerAttendanceReportsCardProps) {
  const { sessions } = useSessions();
  const { classes } = useClasses();
  const { learners } = useLearners();
  const { loadSessionRecords, getBySession: getAttendanceBySession } = useAttendance();
  const { getBySession: getReportBySession } = useSessionReports();

  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [reportOpen, setReportOpen] = useState<SessionReport | null>(null);

  const learnerIdSet = useMemo(() => new Set(learnerIds), [learnerIds]);
  const learnerNameById = useMemo(
    () => new Map(learners.map((l) => [l.id, `${l.firstName} ${l.lastName}`.trim()])),
    [learners]
  );
  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  const relevantSessions = useMemo(() => {
    if (learnerIdSet.size === 0) return [];
    const classIds = new Set(
      classes
        .filter((c) => (c.learnerIds ?? []).some((lid) => learnerIdSet.has(lid)))
        .map((c) => c.id)
    );
    return [...sessions]
      .filter((s) => classIds.has(s.classId))
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        if (d !== 0) return d;
        return (b.startTime ?? "").localeCompare(a.startTime ?? "");
      })
      .slice(0, 40);
  }, [classes, sessions, learnerIdSet]);

  const sessionIdsKey = useMemo(
    () => relevantSessions.map((s) => s.id).sort().join(","),
    [relevantSessions]
  );

  useEffect(() => {
    if (relevantSessions.length === 0) {
      setAttendanceLoaded(true);
      return;
    }
    let cancelled = false;
    setAttendanceLoaded(false);
    void (async () => {
      await Promise.all(relevantSessions.map((s) => loadSessionRecords(s.id)));
      if (!cancelled) setAttendanceLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionIdsKey, relevantSessions, loadSessionRecords]);

  const rows = useMemo(
    () =>
      relevantSessions.map((session) => {
        const records = getAttendanceBySession(session.id);
        const presentNames = records
          .filter((r) => learnerIdSet.has(r.learnerId) && isPresentStatus(r.status))
          .map((r) => learnerNameById.get(r.learnerId) ?? r.learnerId);
        const report = getReportBySession(session.id);
        return {
          session,
          presentNames,
          report,
          className: classNameById.get(session.classId) ?? session.classId,
        };
      }),
    [relevantSessions, getAttendanceBySession, getReportBySession, learnerIdSet, learnerNameById, classNameById]
  );

  if (learnerIds.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="w-5 h-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {!attendanceLoaded ? (
            <p className="text-sm text-muted-foreground py-6">Loading attendance for recent sessions…</p>
          ) : relevantSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              No sessions found for classes that include your learners yet.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Present (your learners)</TableHead>
                    <TableHead className="w-[140px]">Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ session, presentNames, report, className }) => (
                    <TableRow key={session.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{formatSessionDate(session.date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.startTime}–{session.endTime}
                          {session.topic ? ` · ${session.topic}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm">{className}</TableCell>
                      <TableCell className="align-top text-sm">
                        {presentNames.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-0.5">
                            {presentNames.map((name) => (
                              <li key={`${session.id}-${name}`}>{name}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">None marked present/late</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {report?.status === "submitted" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setReportOpen(report)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View report
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            {report ? "Draft" : "—"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!reportOpen} onOpenChange={(open) => !open && setReportOpen(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {reportOpen && (
            <>
              <SheetHeader>
                <SheetTitle>Session report</SheetTitle>
                <SheetDescription>
                  {formatSessionDate(reportOpen.date)} · {reportOpen.schoolOrOrganizationName || "Session summary"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Learners in session</p>
                  <p className="font-medium">{reportOpen.totalLearners}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Track</p>
                  <p>{LEARNING_TRACK_LABELS[reportOpen.learningTrack] ?? reportOpen.learningTrack}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Objectives met</p>
                  <p className="capitalize">{reportOpen.objectivesMet.replace("_", " ")}</p>
                </div>
                {reportOpen.highlights && reportOpen.highlights.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">Highlights</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {reportOpen.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(reportOpen.ranAsPlannedNotes || reportOpen.exceptionalLearnersNotes) && (
                  <div className="space-y-2">
                    {reportOpen.ranAsPlannedNotes && (
                      <div>
                        <p className="text-muted-foreground mb-1">Session notes</p>
                        <p className="whitespace-pre-wrap">{reportOpen.ranAsPlannedNotes}</p>
                      </div>
                    )}
                    {reportOpen.exceptionalLearnersNotes && (
                      <div>
                        <p className="text-muted-foreground mb-1">Standout learners</p>
                        <p className="whitespace-pre-wrap">{reportOpen.exceptionalLearnersNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

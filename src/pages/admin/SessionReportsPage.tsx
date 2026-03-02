import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useTasks } from "@/features/tasks/context/TasksContext";
import { useNotifications } from "@/context/NotificationsContext";
import { getSession, getClass, getEducatorName } from "@/mockData";
import { mockSessions } from "@/mockData";
import {
  buildSessionReportSummary,
  buildMissingSessionSummary,
} from "@/lib/sessionReportAdmin";
import type { SessionReportSummary, SessionReportSessionTypeAdmin, SessionReportStatusAdmin } from "@/types";
import {
  SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS,
  SESSION_REPORT_STATUS_ADMIN_LABELS,
} from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Send, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SESSION_TYPES: SessionReportSessionTypeAdmin[] = [
  "MAKERSPACE",
  "SCHOOL_STEM_CLUB",
  "VIRTUAL",
  "HOME",
  "ORGANISATION",
  "MIRADI",
];

const STATUSES: SessionReportStatusAdmin[] = ["SUBMITTED", "MISSING", "FLAGGED"];

function presentCountForSession(
  sessionId: string,
  getBySession: (id: string) => { status: string }[]
): number {
  const records = getBySession(sessionId);
  return records.filter((r) => r.status === "present" || r.status === "late").length;
}

export default function SessionReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { list, getBySession } = useSessionReports();
  const { getBySession: getAttendanceBySession } = useAttendance();

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sessionTypes, setSessionTypes] = useState<SessionReportSessionTypeAdmin[]>([]);
  const [organisation, setOrganisation] = useState<string>("all");
  const [statuses, setStatuses] = useState<SessionReportStatusAdmin[]>([]);
  const [reminderDialog, setReminderDialog] = useState<{
    educatorName: string;
    sessionId: string;
    leadEducatorId: string;
    sessionDate: string;
    className: string;
  } | null>(null);
  const { currentUser } = useAuth();
  const { createTask } = useTasks();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const summariesFromReports = useMemo(() => {
    const filtered = list({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    return filtered.map((r) => {
      const present = presentCountForSession(r.sessionId, getAttendanceBySession);
      return buildSessionReportSummary(
        r,
        getSession,
        getClass,
        getEducatorName,
        present
      );
    });
  }, [list, dateFrom, dateTo, getAttendanceBySession]);

  const missingSummaries = useMemo(() => {
    const sessionsWithoutSubmitted = mockSessions.filter(
      (s) => getBySession(s.id)?.status !== "submitted"
    );
    const out = sessionsWithoutSubmitted
      .filter((s) => {
        if (dateFrom && s.date < dateFrom) return false;
        if (dateTo && s.date > dateTo) return false;
        return true;
      })
      .map((s) => {
        const present = presentCountForSession(s.id, getAttendanceBySession);
        return buildMissingSessionSummary(s, getClass, getEducatorName, present);
      });
    return out;
  }, [getBySession, dateFrom, dateTo, getAttendanceBySession]);

  const allSummaries = useMemo(() => {
    const combined = [...summariesFromReports];
    const existingSessionIds = new Set(summariesFromReports.map((s) => s.sessionId));
    for (const m of missingSummaries) {
      if (!existingSessionIds.has(m.sessionId)) combined.push(m);
    }
    return combined.sort((a, b) => (b.sessionDate > a.sessionDate ? 1 : -1));
  }, [summariesFromReports, missingSummaries]);

  const organisationOptions = useMemo(() => {
    const set = new Set(allSummaries.map((s) => s.organisationName).filter(Boolean));
    return Array.from(set).sort();
  }, [allSummaries]);

  const filteredSummaries = useMemo(() => {
    let out = allSummaries;
    if (sessionTypes.length > 0) {
      out = out.filter((s) => sessionTypes.includes(s.sessionType));
    }
    if (organisation && organisation !== "all") {
      out = out.filter((s) => s.organisationName === organisation);
    }
    if (statuses.length > 0) {
      out = out.filter((s) => statuses.includes(s.status));
    }
    return out;
  }, [allSummaries, sessionTypes, organisation, statuses]);

  const toggleSessionType = (t: SessionReportSessionTypeAdmin) => {
    setSessionTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleStatus = (s: SessionReportStatusAdmin) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleRowClick = (row: SessionReportSummary) => {
    navigate(`/admin/session-reports/${row.id}`);
  };

  const handleSendReminderClick = (e: React.MouseEvent, row: SessionReportSummary) => {
    e.stopPropagation();
    const session = getSession(row.sessionId);
    const leadEducatorId = session?.leadEducatorId ?? "";
    if (!leadEducatorId) {
      toast({ title: "Could not determine educator", variant: "destructive" });
      return;
    }
    setReminderDialog({
      educatorName: row.leadEducatorName,
      sessionId: row.sessionId,
      leadEducatorId,
      sessionDate: row.sessionDate,
      className: row.className,
    });
  };

  const handleConfirmReminder = () => {
    if (!reminderDialog) return;
    const { leadEducatorId, sessionId, sessionDate, className, educatorName } = reminderDialog;
    const adminId = currentUser?.id ?? "u1";
    createTask({
      title: `Submit session report: ${className} (${sessionDate})`,
      description: "A reminder was sent. Please submit the session report.",
      createdById: adminId,
      assigneeIds: [leadEducatorId],
      status: "todo",
    });
    addNotification(
      leadEducatorId,
      `Reminder: Please submit the session report for ${className} (${sessionDate}).`,
      `/educator/sessions/${sessionId}/report`
    );
    toast({
      title: "Reminder sent",
      description: `A task was added to ${educatorName}'s to-do list and they will see a notification.`,
    });
    setReminderDialog(null);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2">
        <FileText className="w-6 h-6" /> Session reports
      </h1>
      <p className="page-subtitle">
        View and filter session reports by date, session type, organisation, or status.
      </p>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load session reports.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setIsError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Date range, session type, organisation, and status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date from</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date to</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Session type</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {sessionTypes.length === 0
                      ? "All types"
                      : `${sessionTypes.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  {SESSION_TYPES.map((t) => (
                    <label
                      key={t}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={sessionTypes.includes(t)}
                        onCheckedChange={() => toggleSessionType(t)}
                      />
                      {SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS[t]}
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Organisation</label>
              <Select value={organisation} onValueChange={(v) => setOrganisation(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {organisationOptions.map((org) => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {statuses.length === 0 ? "All statuses" : `${statuses.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  {STATUSES.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={statuses.includes(s)}
                        onCheckedChange={() => toggleStatus(s)}
                      />
                      {SESSION_REPORT_STATUS_ADMIN_LABELS[s]}
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredSummaries.length === 0 ? (
            <p className="p-6 text-muted-foreground">No session reports match the filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Session type</TableHead>
                  <TableHead>School / Organisation</TableHead>
                  <TableHead>Class / Group</TableHead>
                  <TableHead>Lead educator</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(row)}
                  >
                    <TableCell>{row.sessionDate}</TableCell>
                    <TableCell>{SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS[row.sessionType]}</TableCell>
                    <TableCell>{row.organisationName}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.leadEducatorName}</TableCell>
                    <TableCell>
                      {row.presentCount} / {row.totalLearners}
                    </TableCell>
                    <TableCell>
                      {row.engagementRating != null ? `${row.engagementRating}/5` : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                          row.status === "SUBMITTED" && "bg-green-500/15 text-green-700 dark:text-green-400",
                          row.status === "MISSING" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                          row.status === "FLAGGED" && "bg-red-500/15 text-red-700 dark:text-red-400"
                        )}
                      >
                        {SESSION_REPORT_STATUS_ADMIN_LABELS[row.status]}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {row.status === "MISSING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={(e) => handleSendReminderClick(e, row)}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send reminder
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!reminderDialog} onOpenChange={(open) => !open && setReminderDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send reminder</AlertDialogTitle>
            <AlertDialogDescription>
              {reminderDialog
                ? `Send a reminder to ${reminderDialog.educatorName}? A to-do will be added to their task list and they will see a notification on their Tasks tab.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReminder}>
              Send reminder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

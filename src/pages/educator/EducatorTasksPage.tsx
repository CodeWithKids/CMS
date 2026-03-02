import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useSessions } from "@/context/SessionsContext";
import { useTasks, useMyTasks } from "@/features/tasks/context/TasksContext";
import { canUpdateOwnTaskStatus } from "@/features/tasks/lib/permissions";
import { getClass, getEducatorName } from "@/mockData";
import type { Task, TaskStatus } from "@/types";
import { LEARNING_TRACK_LABELS } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ListTodo, FileText, AlertCircle, Bell } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const m = new Date(d);
  m.setDate(diff);
  return m.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return dateStr;
  }
}

const statusVariant: Record<TaskStatus, "secondary" | "default" | "outline"> = {
  todo: "secondary",
  in_progress: "default",
  done: "outline",
};

export default function EducatorTasksPage() {
  const { currentUser } = useAuth();
  const educatorId = currentUser?.id ?? "";
  const myTasks = useMyTasks(educatorId);
  const { updateTask, getTaskById } = useTasks();
  const { getBySession: getReportBySession } = useSessionReports();
  const { getSessionsForEducatorByRole } = useSessions();
  const { getUnreadForUser, markAsRead } = useNotifications();
  const { toast } = useToast();
  const [detailId, setDetailId] = useState<string | null>(null);

  const unreadNotifications = getUnreadForUser(educatorId);

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const sessionsWithoutReport = useMemo(
    () =>
      getSessionsForEducatorByRole(educatorId, { from: weekStart, to: today }).filter(
        (s) => getReportBySession(s.id)?.status !== "submitted"
      ),
    [educatorId, weekStart, getReportBySession, getSessionsForEducatorByRole]
  );

  const sortedTasks = useMemo(
    () =>
      [...myTasks].sort((a, b) => {
        const aDue = a.dueDate ?? "9999-12-31";
        const bDue = b.dueDate ?? "9999-12-31";
        return aDue.localeCompare(bDue) || a.createdAt.localeCompare(b.createdAt);
      }),
    [myTasks]
  );

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    if (!currentUser || !canUpdateOwnTaskStatus(currentUser, task.assigneeIds)) return;
    updateTask(task.id, { status: newStatus });
    toast({ title: "Status updated" });
  };

  const detailTask = detailId ? getTaskById(detailId) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ListTodo className="w-6 h-6" /> My tasks
        </h1>
        <p className="text-muted-foreground">
          Session reports to complete and tasks assigned to you by L&D.
        </p>
      </div>

      {/* Notifications (e.g. reminders from admin) */}
      {unreadNotifications.length > 0 && (
        <Alert className="border-primary/30 bg-primary/5">
          <Bell className="h-4 w-4" />
          <AlertTitle>Notifications</AlertTitle>
          <AlertDescription asChild>
            <ul className="mt-2 space-y-2 list-none p-0">
              {unreadNotifications.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm">{n.message}</span>
                  <span className="flex items-center gap-2">
                    {n.link && (
                      <Button variant="link" size="sm" className="p-0 h-auto font-medium" asChild>
                        <Link to={n.link} onClick={() => markAsRead(n.id)}>
                          View
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => markAsRead(n.id)}
                    >
                      Dismiss
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions needing reports — one task per session: fill report for that session */}
      {sessionsWithoutReport.length > 0 && (
        <div className="space-y-3">
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertTitle>Sessions not complete</AlertTitle>
            <AlertDescription>
              You still have {sessionsWithoutReport.length} session{sessionsWithoutReport.length !== 1 ? "s" : ""} without
              reports. Sessions are not complete until the report is submitted.
            </AlertDescription>
          </Alert>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsWithoutReport.map((s) => {
                  const cls = getClass(s.classId);
                  const sessionName = cls?.name ?? `Class ${s.classId}`;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        Fill report for today&apos;s session — {sessionName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sessionName}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(s.date)}</TableCell>
                      <TableCell>
                        <Link
                          to={`/educator/sessions/${s.id}/report`}
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                        >
                          <FileText className="w-4 h-4" /> Fill report
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">L&D tasks</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Tasks assigned to you by L&D. You can update the status only.
        </p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No tasks assigned to you yet.
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailId(t.id)}
                >
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getEducatorName(t.createdById)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.trackId ? LEARNING_TRACK_LABELS[t.trackId] : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.dueDate ?? "—"}</TableCell>
                  <TableCell>
                    {canUpdateOwnTaskStatus(currentUser, t.assigneeIds) ? (
                      <Select
                        value={t.status}
                        onValueChange={(v) => handleStatusChange(t, v as TaskStatus)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To do</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={statusVariant[t.status]}>{t.status.replace("_", " ")}</Badge>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="text-primary text-sm hover:underline"
                      onClick={() => setDetailId(t.id)}
                    >
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detailTask && (
            <>
              <SheetHeader>
                <SheetTitle>{detailTask.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {detailTask.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{detailTask.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium">{getEducatorName(detailTask.createdById)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[detailTask.status]}>{detailTask.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due date</p>
                  <p className="text-sm">{detailTask.dueDate ?? "—"}</p>
                </div>
                {detailTask.trackId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Track</p>
                    <p className="text-sm">{LEARNING_TRACK_LABELS[detailTask.trackId]}</p>
                  </div>
                )}
              </div>
              <Button variant="outline" className="mt-6" onClick={() => setDetailId(null)}>
                Close
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/features/tasks/context/TasksContext";
import { canManageTasks } from "@/features/tasks/lib/permissions";
import { getEducatorName } from "@/mockData";
import { mockStaff, mockClasses } from "@/mockData";
import type { Task, TaskStatus } from "@/types";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ListTodo, Plus } from "lucide-react";

const STATUS_OPTIONS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const statusVariant: Record<TaskStatus, "secondary" | "default" | "outline"> = {
  todo: "secondary",
  in_progress: "default",
  done: "outline",
};

const TRACK_OPTIONS: LearningTrack[] = [
  "game_design",
  "python",
  "robotics",
  "computer_basics",
  "web_design",
  "ai",
];

const educators = mockStaff.filter((s) => s.role === "educator");

export default function LDTasksPage() {
  const { currentUser } = useAuth();
  const { tasks, createTask, updateTask, getTaskById } = useTasks();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  const canManage = currentUser && canManageTasks(currentUser);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") return [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return tasks.filter((t) => t.status === statusFilter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tasks, statusFilter]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeIds: [] as string[],
    dueDate: "",
    trackId: "" as LearningTrack | "",
    classId: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      assigneeIds: [],
      dueDate: "",
      trackId: "",
      classId: "",
    });
  };

  const handleCreate = () => {
    if (!form.title.trim() || !currentUser) return;
    if (form.assigneeIds.length === 0) {
      toast({ title: "Select at least one assignee", variant: "destructive" });
      return;
    }
    createTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      createdById: currentUser.id,
      assigneeIds: form.assigneeIds,
      dueDate: form.dueDate || undefined,
      trackId: form.trackId || null,
      classId: form.classId || null,
    });
    toast({ title: "Task created" });
    resetForm();
    setCreateOpen(false);
  };

  const toggleAssignee = (id: string) => {
    setForm((prev) =>
      prev.assigneeIds.includes(id)
        ? { ...prev, assigneeIds: prev.assigneeIds.filter((x) => x !== id) }
        : { ...prev, assigneeIds: [...prev.assigneeIds, id] }
    );
  };

  const detailTask = detailTaskId ? getTaskById(detailTaskId) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListTodo className="w-6 h-6" /> Tasks
          </h1>
          <p className="text-muted-foreground">
            Create and assign tasks to educators. L&D and Admin can manage all tasks.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New task
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Label className="text-sm text-muted-foreground">Status</Label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="text-center text-muted-foreground py-8">
                  {tasks.length === 0
                    ? "No tasks created yet. Click 'New task' to get started."
                    : "No tasks match the filter."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailTaskId(t.id)}
                >
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {t.assigneeIds.map((id) => getEducatorName(id)).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.trackId ? LEARNING_TRACK_LABELS[t.trackId] : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.dueDate ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[t.status]}>{t.status.replace("_", " ")}</Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setDetailTaskId(t.id)}>
                        View
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create task dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Review lesson plan"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Assignees *</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                {educators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No educators in staff list.</p>
                ) : (
                  educators.map((e) => (
                    <div key={e.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assignee-${e.id}`}
                        checked={form.assigneeIds.includes(e.id)}
                        onCheckedChange={() => toggleAssignee(e.id)}
                      />
                      <label htmlFor={`assignee-${e.id}`} className="text-sm font-medium cursor-pointer">
                        {e.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Track</Label>
              <Select value={form.trackId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, trackId: v === "none" ? "" : (v as LearningTrack) }))}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {TRACK_OPTIONS.map((tr) => (
                    <SelectItem key={tr} value={tr}>{LEARNING_TRACK_LABELS[tr]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Class</Label>
              <Select value={form.classId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, classId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {mockClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task detail / edit sheet */}
      <Sheet open={!!detailTaskId} onOpenChange={(open) => !open && setDetailTaskId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailTask && (
            <TaskDetailSheet
              task={detailTask}
              onClose={() => setDetailTaskId(null)}
              onUpdate={(updates) => {
                updateTask(detailTask.id, updates);
                toast({ title: "Task updated" });
              }}
              canEdit={!!canManage}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TaskDetailSheet({
  task,
  onClose,
  onUpdate,
  canEdit,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds);
  const [trackId, setTrackId] = useState<string>(task.trackId ?? "");
  const [classId, setClassId] = useState(task.classId ?? "");

  useEffect(() => {
    if (!editing) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(task.status);
      setDueDate(task.dueDate ?? "");
      setAssigneeIds(task.assigneeIds);
      setTrackId(task.trackId ?? "");
      setClassId(task.classId ?? "");
    }
  }, [task.id, task.title, task.description, task.status, task.dueDate, task.assigneeIds, task.trackId, task.classId, editing]);

  const handleSave = () => {
    onUpdate({
      title,
      description: description || undefined,
      status,
      dueDate: dueDate || undefined,
      assigneeIds,
      trackId: (trackId as LearningTrack) || null,
      classId: classId || null,
    });
    setEditing(false);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{editing ? "Edit task" : "Task details"}</SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        <div>
          <Label className="text-muted-foreground">Title</Label>
          {editing ? (
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          ) : (
            <p className="font-medium mt-1">{task.title}</p>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">Description</Label>
          {editing ? (
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" />
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{task.description || "—"}</p>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">Assignees</Label>
          {editing ? (
            <div className="mt-2 space-y-2 border rounded-md p-2 max-h-28 overflow-y-auto">
              {educators.map((e) => (
                <div key={e.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={assigneeIds.includes(e.id)}
                    onCheckedChange={() =>
                      setAssigneeIds((prev) =>
                        prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id]
                      )
                    }
                  />
                  <span className="text-sm">{e.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm mt-1">{task.assigneeIds.map(getEducatorName).join(", ") || "—"}</p>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">Status</Label>
          {editing ? (
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={statusVariant[task.status]} className="mt-1">{task.status.replace("_", " ")}</Badge>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">Due date</Label>
          {editing ? (
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
          ) : (
            <p className="text-sm mt-1">{task.dueDate ?? "—"}</p>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">Track</Label>
          {editing ? (
            <Select value={trackId || "none"} onValueChange={(v) => setTrackId(v === "none" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {TRACK_OPTIONS.map((tr) => (
                  <SelectItem key={tr} value={tr}>{LEARNING_TRACK_LABELS[tr]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm mt-1">{task.trackId ? LEARNING_TRACK_LABELS[task.trackId] : "—"}</p>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">Class</Label>
          {editing ? (
            <Select value={classId || "none"} onValueChange={(v) => setClassId(v === "none" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {mockClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm mt-1">{task.classId ? mockClasses.find((c) => c.id === task.classId)?.name ?? task.classId : "—"}</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Created {task.createdAt}</p>
      </div>
      <div className="flex gap-2 mt-8">
        {canEdit && !editing && (
          <Button onClick={() => setEditing(true)}>Edit</Button>
        )}
        {canEdit && editing && (
          <>
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </>
        )}
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </>
  );
}

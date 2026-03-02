import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCoachingInvites } from "@/context/CoachingInvitesContext";
import { useSchedule } from "@/context/ScheduleContext";
import { getClass, mockUsers } from "@/mockData";
import { useSessions } from "@/context/SessionsContext";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { AvailabilitySlot, AvailabilitySlotType } from "@/types";
import { getSessionRoleForUser } from "@/features/educator/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  COMPULSORY_TEAM_MEETING,
  COMPULSORY_EDUCATORS_MEETING,
  isBiWeeklyThursday,
} from "@/lib/compulsoryCalendarBlocks";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8–18

function getWeekDates(ref: Date): Date[] {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function overlaps(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

const SLOT_TYPE_LABELS: Record<AvailabilitySlotType, string> = {
  facilitating: "Facilitating",
  coaching: "Coaching",
  unavailable: "Unavailable",
  other: "Other",
};

const VIEW_ME = "me";
const VIEW_TEAM = "team";

export default function EducatorSchedulePage() {
  const { currentUser } = useAuth();
  const { getSessionsForEducatorByRole } = useSessions();
  const { getSlotsForEducator, addSlot, updateSlot, removeSlot } = useSchedule();
  const { getForEducator: getCoachingInvitesForEducator } = useCoachingInvites();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const m = new Date(d);
    m.setDate(diff);
    return m.toISOString().split("T")[0];
  });
  const [viewMode, setViewMode] = useState<string>(VIEW_ME);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [formDay, setFormDay] = useState(0);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("12:00");
  const [formType, setFormType] = useState<AvailabilitySlotType>("facilitating");
  const [formNote, setFormNote] = useState("");
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);

  const allEducators = useMemo(
    () => mockUsers.filter((u) => u.role === "educator"),
    []
  );
  const educatorId = currentUser?.id ?? "";
  const isViewingSelf = viewMode === VIEW_ME;
  const isViewingTeam = viewMode === VIEW_TEAM;

  const weekDates = useMemo(() => getWeekDates(new Date(weekStart)), [weekStart]);

  /** When viewing "me": one educator's slots. When viewing "team": all educators' slots with educatorId attached for labelling. */
  const slots = useMemo(() => {
    if (isViewingSelf) return getSlotsForEducator(educatorId);
    return allEducators.flatMap((e) =>
      getSlotsForEducator(e.id).map((slot) => ({ ...slot, _educatorId: e.id, _educatorName: e.name }))
    );
  }, [getSlotsForEducator, educatorId, isViewingSelf, allEducators]);

  /** When viewing "me": one educator's sessions. When viewing "team": all educators' sessions (role per session for label). */
  const sessionsInWeek = useMemo(() => {
    const start = weekDates[0].toISOString().split("T")[0];
    const end = weekDates[6].toISOString().split("T")[0];
    if (isViewingSelf) return getSessionsForEducatorByRole(educatorId, { from: start, to: end });
    return allEducators.flatMap((e) =>
      getSessionsForEducatorByRole(e.id, { from: start, to: end }).map((s) => ({
        ...s,
        _educatorId: e.id,
        _educatorName: e.name,
      }))
    );
  }, [weekDates, educatorId, getSessionsForEducatorByRole, isViewingSelf, allEducators]);

  /** Coaching invites (accepted or pending) for this educator in the week — only when viewing "My schedule". */
  const coachingInvitesInWeek = useMemo(() => {
    if (!isViewingSelf) return [];
    const start = weekDates[0].toISOString().split("T")[0];
    const end = weekDates[6].toISOString().split("T")[0];
    return getCoachingInvitesForEducator(educatorId).filter(
      (inv) => (inv.status === "accepted" || inv.status === "pending") && inv.date >= start && inv.date <= end
    );
  }, [isViewingSelf, educatorId, weekDates, getCoachingInvitesForEducator]);

  const handleAddBlock = () => {
    const myId = currentUser?.id ?? "";
    addSlot({
      educatorId: myId,
      dayOfWeek: formDay,
      startTime: formStart,
      endTime: formEnd,
      type: formType,
      note: formNote || undefined,
    });
    toast({ title: "Block added", description: "Availability block added to your schedule." });
    setDialogOpen(false);
    resetForm();
  };

  const handleUpdateBlock = () => {
    if (!editingSlotId) return;
    updateSlot(editingSlotId, {
      dayOfWeek: formDay,
      startTime: formStart,
      endTime: formEnd,
      type: formType,
      note: formNote || undefined,
    });
    toast({ title: "Block updated", description: "Availability block updated." });
    setEditingSlotId(null);
    setDialogOpen(false);
    resetForm();
  };

  const handleDeleteBlock = (id: string) => {
    removeSlot(id);
    setDeleteSlotId(null);
    toast({ title: "Block removed", description: "Availability block removed." });
  };

  function resetForm() {
    setFormDay(0);
    setFormStart("09:00");
    setFormEnd("12:00");
    setFormType("facilitating");
    setFormNote("");
  }

  const openEdit = (slot: AvailabilitySlot) => {
    setEditingSlotId(slot.id);
    setFormDay(slot.dayOfWeek);
    setFormStart(slot.startTime);
    setFormEnd(slot.endTime);
    setFormType(slot.type);
    setFormNote(slot.note ?? "");
    setDialogOpen(true);
  };

  const mySlotsForConflicts = useMemo(() => (isViewingSelf ? slots : []), [isViewingSelf, slots]);
  const slotConflicts = useMemo(() => {
    const set = new Set<string>();
    const list = mySlotsForConflicts as AvailabilitySlot[];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.dayOfWeek !== b.dayOfWeek) continue;
        if (overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) {
          set.add(a.id);
          set.add(b.id);
        }
      }
    }
    return set;
  }, [mySlotsForConflicts]);

  const viewLabel = isViewingSelf ? "My schedule" : "Entire team schedule";

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2">
        <Calendar className="w-6 h-6" /> Schedule
      </h1>
      <p className="page-subtitle text-muted-foreground mb-4">
        {isViewingSelf
          ? "View and edit your weekly availability. Sessions you facilitate or coach appear on the grid. Accepted coaching invites from L&D also appear."
          : "View all educators' sessions and availability in one place. Read-only."}
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <Label className="text-sm">View</Label>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[220px] mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VIEW_ME}>My schedule</SelectItem>
              <SelectItem value={VIEW_TEAM}>Entire team schedule</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Week starting</Label>
          <Input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-[160px] mt-1"
          />
        </div>
        {isViewingSelf && (
          <Button
            className="mt-6"
            onClick={() => {
              setEditingSlotId(null);
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add block
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Week view</CardTitle>
          <CardDescription>
            {viewLabel} · {weekDates[0].toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} –{" "}
            {weekDates[6].toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}. Monday 9:00–10:00 team meeting; Thursday 9:00–10:00 educators meeting (bi-weekly), both blocked by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 w-14 text-left bg-muted/50">Time</th>
                  {DAY_LABELS.map((label, i) => (
                    <th key={i} className="border p-2 min-w-[120px] bg-muted/50">
                      {label} {weekDates[i].getDate()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <td className="border p-1 text-muted-foreground w-14">
                      {hour}:00
                    </td>
                    {weekDates.map((date, dayIndex) => {
                      const dateKey = toDateKey(date);
                      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
                      const cellSlots = slots.filter(
                        (s) => s.dayOfWeek === dayOfWeek && timeToMinutes(s.startTime) < (hour + 1) * 60 && timeToMinutes(s.endTime) > hour * 60
                      );
                      const cellSessions = sessionsInWeek.filter(
                        (s) => s.date === dateKey && timeToMinutes(s.startTime) < (hour + 1) * 60 && timeToMinutes(s.endTime) > hour * 60
                      );
                      const cellCoaching = isViewingSelf
                        ? coachingInvitesInWeek.filter(
                            (inv) => inv.date === dateKey && timeToMinutes(inv.startTime) < (hour + 1) * 60 && timeToMinutes(inv.endTime) > hour * 60
                          )
                        : [];
                      const isTeamMeetingSlot =
                        dayOfWeek === COMPULSORY_TEAM_MEETING.dayOfWeek && hour === 9;
                      const isEducatorsMeetingSlot =
                        dayOfWeek === COMPULSORY_EDUCATORS_MEETING.dayOfWeek &&
                        hour === 9 &&
                        isBiWeeklyThursday(dateKey);
                      return (
                        <td key={dayIndex} className="border p-1 align-top min-w-[120px]">
                          {isTeamMeetingSlot && (
                            <div className="mb-1 rounded px-2 py-1 text-xs bg-muted border border-border font-medium">
                              {COMPULSORY_TEAM_MEETING.label}
                              <span className="block text-muted-foreground font-normal">
                                {COMPULSORY_TEAM_MEETING.startTime}–{COMPULSORY_TEAM_MEETING.endTime}
                              </span>
                            </div>
                          )}
                          {isEducatorsMeetingSlot && (
                            <div className="mb-1 rounded px-2 py-1 text-xs bg-muted border border-border font-medium">
                              {COMPULSORY_EDUCATORS_MEETING.label}
                              <span className="block text-muted-foreground font-normal">
                                {COMPULSORY_EDUCATORS_MEETING.startTime}–{COMPULSORY_EDUCATORS_MEETING.endTime}
                              </span>
                            </div>
                          )}
                          {cellCoaching.map((inv) => (
                            <div
                              key={inv.id}
                              className="mb-1 rounded px-2 py-1 text-xs bg-secondary/20 border border-secondary/40"
                            >
                              <span className="font-medium">{inv.title ?? "L&D Coaching"}</span>
                              <span className="block text-muted-foreground">
                                {inv.startTime}–{inv.endTime}
                                {inv.status === "pending" && " · Pending accept"}
                              </span>
                            </div>
                          ))}
                          {cellSessions.map((s) => {
                            const cls = getClass(s.classId);
                            const sessionWithEducator = s as typeof s & { _educatorId?: string; _educatorName?: string };
                            const role = isViewingSelf
                              ? getSessionRoleForUser(s, currentUser)
                              : (sessionWithEducator._educatorId && s.leadEducatorId === sessionWithEducator._educatorId ? "facilitator" : "coach");
                            return (
                              <div
                                key={s.id}
                                className="mb-1 rounded px-2 py-1 text-xs bg-primary/15 border border-primary/30"
                              >
                                {isViewingTeam && sessionWithEducator._educatorName && (
                                  <span className="block font-medium text-muted-foreground text-[10px]">{sessionWithEducator._educatorName}</span>
                                )}
                                <span className="font-medium">{cls?.name ?? s.classId}</span>
                                <span className="block text-muted-foreground">
                                  {s.startTime}–{s.endTime} · {LEARNING_TRACK_LABELS[s.learningTrack] ?? s.learningTrack}
                                </span>
                                {role && (
                                  <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] ${role === "facilitator" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                    {role === "facilitator" ? "Facilitator" : "Coach"}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {cellSlots.map((slot) => {
                            const slotWithEducator = slot as typeof slot & { _educatorName?: string };
                            return (
                              <div
                                key={slot.id}
                                className={`mb-1 rounded px-2 py-1 text-xs flex items-center justify-between gap-1 ${
                                  isViewingSelf && slotConflicts.has(slot.id) ? "bg-destructive/15 border border-destructive/50" : "bg-muted"
                                }`}
                              >
                                <span>
                                  {isViewingTeam && slotWithEducator._educatorName && (
                                    <span className="font-medium text-muted-foreground text-[10px]">{slotWithEducator._educatorName} · </span>
                                  )}
                                  {slot.startTime}–{slot.endTime} {SLOT_TYPE_LABELS[slot.type]}
                                  {slot.note && ` · ${slot.note}`}
                                </span>
                                {isViewingSelf && (
                                  <span className="flex gap-0.5">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(slot)}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteSlotId(slot.id)} aria-label={`Remove block ${slot.startTime}-${slot.endTime}`}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {slots.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              {isViewingSelf
                ? "No availability blocks yet. Click \"Add block\" to set your weekly availability."
                : "No availability blocks for the team this week."}
            </p>
          )}
          {isViewingSelf && slots.some((s) => slotConflicts.has(s.id)) && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Some blocks overlap. Please adjust times to avoid conflicts.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlotId ? "Edit block" : "Add availability block"}</DialogTitle>
            <DialogDescription>
              Set your availability for the week. These blocks repeat for the selected week pattern.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Day</Label>
                <Select value={String(formDay)} onValueChange={(v) => setFormDay(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((l, i) => (
                      <SelectItem key={i} value={String(i)}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as AvailabilitySlotType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SLOT_TYPE_LABELS) as AvailabilitySlotType[]).map((k) => (
                      <SelectItem key={k} value={k}>{SLOT_TYPE_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start time</Label>
                <Input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div>
                <Label>End time</Label>
                <Input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea placeholder="e.g. Scratch Explorers" value={formNote} onChange={(e) => setFormNote(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {editingSlotId ? (
              <Button onClick={handleUpdateBlock}>Save changes</Button>
            ) : (
              <Button onClick={handleAddBlock}>Add block</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSlotId} onOpenChange={(open) => !open && setDeleteSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove availability block</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this time block from your schedule?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSlotId && handleDeleteBlock(deleteSlotId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

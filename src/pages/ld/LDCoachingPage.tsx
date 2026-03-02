import { useState } from "react";
import { Link } from "react-router-dom";
import { getSessionsForTerm, getCurrentTerm, mockStaff, getEducatorName } from "@/mockData";
import { useAuth } from "@/context/AuthContext";
import { useCoachingInvites } from "@/context/CoachingInvitesContext";
import { useLearnerFeedback } from "@/context/LearnerFeedbackContext";
import { useSessionReports } from "@/context/SessionReportsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { Users, CalendarPlus, Clock } from "lucide-react";

const educators = mockStaff.filter((s) => s.role === "educator");

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i < 10 ? `0${i}` : `${i}`;
  return [`${h}:00`, `${h}:30`];
}).flat();

function formatDate(d: string): string {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return d;
  }
}

function avgRatingForSessions(sessionIds: string[], feedbacks: { sessionId: string; rating: number }[]): number | null {
  const relevant = feedbacks.filter((f) => sessionIds.includes(f.sessionId));
  if (relevant.length === 0) return null;
  return relevant.reduce((s, f) => s + f.rating, 0) / relevant.length;
}

export default function LDCoachingPage() {
  const { currentUser } = useAuth();
  const ldmId = currentUser?.id ?? "";
  const currentTerm = getCurrentTerm();
  const termId = currentTerm?.id ?? "t1";
  const termSessions = getSessionsForTerm(termId);
  const { feedbacks } = useLearnerFeedback();
  const { list: listReports } = useSessionReports();
  const { getCreatedBy, create, checkSlotAvailability } = useCoachingInvites();
  const { toast } = useToast();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleEducatorId, setScheduleEducatorId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStart, setScheduleStart] = useState("10:00");
  const [scheduleEnd, setScheduleEnd] = useState("11:00");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  const myCoachingSessions = getCreatedBy(ldmId);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingCoaching = myCoachingSessions.filter((c) => c.date >= today || c.status === "pending");

  const handleScheduleSubmit = () => {
    if (!scheduleEducatorId || !scheduleDate || !scheduleStart || !scheduleEnd) {
      toast({ title: "Please fill educator, date, and time", variant: "destructive" });
      return;
    }
    if (scheduleStart >= scheduleEnd) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }
    const availability = checkSlotAvailability(
      scheduleEducatorId,
      scheduleDate,
      scheduleStart,
      scheduleEnd
    );
    if (!availability.available) {
      toast({
        title: "Slot not available",
        description:
          availability.reason ??
          (availability.conflictingSession
            ? "Educator has a class at this time. Choose a slot when they have no classes."
            : "This time slot is not available."),
        variant: "destructive",
      });
      return;
    }
    try {
      create({
        educatorId: scheduleEducatorId,
        createdById: ldmId,
        date: scheduleDate,
        startTime: scheduleStart,
        endTime: scheduleEnd,
        title: scheduleTitle || null,
        notes: scheduleNotes || null,
      });
      toast({ title: "Coaching session scheduled. Educator will receive a calendar invite." });
      setScheduleOpen(false);
      setScheduleEducatorId("");
      setScheduleDate("");
      setScheduleStart("10:00");
      setScheduleEnd("11:00");
      setScheduleTitle("");
      setScheduleNotes("");
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Could not schedule",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6" /> Educator coaching
        </h1>
        <p className="text-muted-foreground">
          View educators and their teaching data. Schedule coaching sessions on the calendar and add notes from each educator’s detail page.
        </p>
      </div>

      {/* Coaching calendar: schedule session + list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5" /> Coaching & mentoring sessions
            </CardTitle>
            <CardDescription>
              Schedule a session on the calendar and assign an educator. You can only choose time slots when the educator has no classes.
            </CardDescription>
          </div>
          <Button onClick={() => setScheduleOpen(true)}>
            <CalendarPlus className="w-4 h-4 mr-2" /> Schedule coaching
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingCoaching.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No coaching sessions scheduled yet. Click &quot;Schedule coaching&quot; to create a calendar invite for an educator.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Educator</TableHead>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingCoaching.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{getEducatorName(inv.educatorId)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(inv.date)} {inv.startTime}–{inv.endTime}
                    </TableCell>
                    <TableCell>{inv.title ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          inv.status === "accepted"
                            ? "text-green-600 dark:text-green-400"
                            : inv.status === "declined"
                              ? "text-muted-foreground"
                              : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {inv.status === "pending"
                          ? "Pending (awaiting educator)"
                          : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule coaching session</DialogTitle>
            <DialogDescription>
              Pick an educator and a time slot when they have no classes. They will receive a calendar invite and must accept.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Educator</Label>
              <Select value={scheduleEducatorId} onValueChange={setScheduleEducatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select educator" />
                </SelectTrigger>
                <SelectContent>
                  {educators.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Start time</Label>
                <Select value={scheduleStart} onValueChange={setScheduleStart}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>End time</Label>
                <Select value={scheduleEnd} onValueChange={setScheduleEnd}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Title (optional)</Label>
              <Input
                placeholder="e.g. Scratch facilitation check-in"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Agenda or notes for the session"
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleSubmit}>Send calendar invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Educators</CardTitle>
          <CardDescription>Name, tracks, sessions this term, and average learner feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location / centre</TableHead>
                <TableHead>Tracks taught</TableHead>
                <TableHead>Sessions (term)</TableHead>
                <TableHead>Avg feedback</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {educators.map((e) => {
                const sessions = termSessions.filter(
                  (s) => s.leadEducatorId === e.id || (s.assistantEducatorIds ?? []).includes(e.id)
                );
                const sessionIds = sessions.map((s) => s.id);
                const tracks = [...new Set(sessions.map((s) => s.learningTrack))];
                const avg = avgRatingForSessions(
                  sessionIds,
                  feedbacks.map((f) => ({ sessionId: f.sessionId, rating: f.rating }))
                );
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell>{tracks.slice(0, 3).join(", ") || "—"}</TableCell>
                    <TableCell>{sessions.length}</TableCell>
                    <TableCell>{avg != null ? avg.toFixed(1) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/ld/coaching/${e.id}`}>View & add notes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import { useSessionExpenses } from "@/context/SessionExpensesContext";
import { getClass, getLearner } from "@/mockData";
import { useSessions } from "@/context/SessionsContext";
import { getSessionRoleForUser, canEditSession } from "@/features/educator/lib/auth";
import { AddCoachDialog } from "@/features/educator/components/AddCoachDialog";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import { SessionRoleChips } from "@/features/educator/components/SessionRoleChips";
import { ArrowLeft, CheckCircle, XCircle, Clock, Receipt, Save, FileText, CalendarCheck, Star, Award, UserPlus } from "lucide-react";
import type { AttendanceRecord, AttendanceStatus } from "@/types";
import type { BadgeType } from "@/types";
import { SESSION_TYPE_LABELS, SESSION_DURATION_LABELS, LEARNING_TRACK_LABELS } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const MAX_STARS = 3;
const BADGE_NOTE_MAX = 140;

const STATUSES: { value: AttendanceStatus; label: string; icon: React.ReactNode; short: string }[] = [
  { value: "present", label: "Present", icon: <CheckCircle className="w-5 h-5" />, short: "P" },
  { value: "absent", label: "Absent", icon: <XCircle className="w-5 h-5" />, short: "A" },
  { value: "late", label: "Late", icon: <Clock className="w-5 h-5" />, short: "L" },
  { value: "excused", label: "Excused", icon: <CalendarCheck className="w-5 h-5" />, short: "E" },
];

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function AttendancePage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getBySession, setRecord, markAllPresent } = useAttendance();
  const { getByLearnerAndSession, addAward } = useBadgeAwards();
  const { getExpenseBySessionAndEducator } = useSessionExpenses();
  const { toast } = useToast();
  const [learnerIdForBadge, setLearnerIdForBadge] = useState<string | null>(null);
  const [badgeNote, setBadgeNote] = useState("");
  const [coachDialogOpen, setCoachDialogOpen] = useState(false);

  const { getSessionById } = useSessions();
  const session = getSessionById(sessionId ?? "");
  const cls = session ? getClass(session.classId) : null;
  const educatorId = currentUser?.id ?? "";
  const role = getSessionRoleForUser(session, currentUser);
  const isCoachReadOnly = role === "coach";
  const existingRecords = sessionId ? getBySession(sessionId) : [];
  const expense = sessionId && educatorId ? getExpenseBySessionAndEducator(sessionId, educatorId) : null;

  const getRecord = (learnerId: string): AttendanceRecord | undefined =>
    existingRecords.find((r) => r.learnerId === learnerId);

  const mergeRecord = (learnerId: string, updates: Partial<AttendanceRecord>): AttendanceRecord => {
    const rec = getRecord(learnerId);
    return {
      learnerId,
      sessionId: session!.id,
      status: (rec?.status ?? "present") as AttendanceStatus,
      absenceType: rec?.absenceType,
      notes: rec?.notes,
      stars: rec?.stars,
      markedAt: new Date().toISOString(),
      markedBy: educatorId,
      ...updates,
    };
  };

  const handleSetStatus = (learnerId: string, status: AttendanceStatus, absenceType?: "excused" | "unexcused") => {
    if (!session) return;
    setRecord(mergeRecord(learnerId, { status, absenceType: status === "absent" ? absenceType : undefined }));
  };

  const handleMarkAllPresent = () => {
    if (cls && sessionId) {
      markAllPresent(sessionId, cls.learnerIds, educatorId);
    }
  };

  const handleSaveAttendance = () => {
    if (!session || !cls) return;
    const now = new Date().toISOString();
    cls.learnerIds.forEach((learnerId) => {
      const rec = getRecord(learnerId);
      setRecord({
        ...mergeRecord(learnerId, {}),
        markedAt: now,
      });
    });
    toast({ title: "Attendance saved", description: "Session attendance has been saved successfully." });
  };

  const handleNotesChange = (learnerId: string, notes: string) => {
    if (!session) return;
    setRecord(mergeRecord(learnerId, { notes: notes.trim() || undefined }));
  };

  const handleSetStars = (learnerId: string, stars: number) => {
    if (!session) return;
    const clamped = Math.max(0, Math.min(MAX_STARS, stars));
    setRecord(mergeRecord(learnerId, { stars: clamped }));
  };

  const handleGiveBadge = (learnerId: string, badgeId: BadgeType, note?: string | null) => {
    addAward({
      learnerId,
      badgeId,
      sessionId: session?.id,
      awardedByEducatorId: educatorId,
      awardedAt: new Date().toISOString(),
      note: note?.trim() || null,
    });
    setLearnerIdForBadge(null);
    setBadgeNote("");
    toast({ title: "Badge awarded", description: `${BADGE_DEFINITIONS.find((b) => b.id === badgeId)?.label ?? badgeId} awarded.` });
  };

  if (!session || !cls) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Session not found.</p>
        <Link to="/educator/dashboard" className="text-primary hover:underline text-sm">← Back</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <Link
        to={`/educator/classes/${session.classId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to class
      </Link>

      {/* Session context: "School STEM Club – Class – 10:00–12:00 – Topic" */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {SESSION_TYPE_LABELS[session.sessionType]} – {cls.name}
          </CardTitle>
          <CardDescription>
            {session.startTime}–{session.endTime} · {session.topic}
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {SESSION_TYPE_LABELS[session.sessionType]}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
              {SESSION_DURATION_LABELS[session.duration]}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
              {LEARNING_TRACK_LABELS[session.learningTrack]}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
            <SessionRoleChips session={session} />
            {canEditSession(session, currentUser) && !isCoachReadOnly && (
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCoachDialogOpen(true)}>
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Manage coaches
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {session && (
        <AddCoachDialog session={session} open={coachDialogOpen} onOpenChange={setCoachDialogOpen} />
      )}

      {isCoachReadOnly && (
        <div className="mb-4 p-3 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
          Only the facilitator can edit attendance for this session. You can view the register below.
        </div>
      )}

      {/* Transport & report links */}
      <div className="flex flex-wrap gap-2">
        {expense && (
          <Card className="border-dashed flex-1 min-w-[200px]">
            <CardContent className="py-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Transport: <span className="font-medium capitalize">{expense.status}</span>
                {expense.status === "requested" && (
                  <Link to={`/educator/sessions/${session.id}/expenses`} className="ml-2 text-primary hover:underline text-xs">
                    View / edit
                  </Link>
                )}
              </span>
            </CardContent>
          </Card>
        )}
        <Link to={`/educator/sessions/${session.id}/report`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <FileText className="w-4 h-4" /> Session report
        </Link>
      </div>

      {/* Mark all present + register */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base">Register</CardTitle>
            {!isCoachReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                className="shrink-0"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Mark all present
              </Button>
            )}
          </div>
          <CardDescription>
            Tap status for each learner. Change only the exceptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cls.learnerIds.map((lid) => {
            const learner = getLearner(lid);
            const rec = getRecord(lid);
            const status = rec?.status ?? "present";
            const name = learner ? `${learner.firstName} ${learner.lastName}` : lid;
            const stars = rec?.stars ?? 0;
            const sessionBadges = sessionId ? getByLearnerAndSession(lid, sessionId) : [];

            return (
              <div
                key={lid}
                className="flex flex-col gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                  <div className="font-medium min-w-[120px]">{name}</div>
                  <div className="flex gap-2 flex-wrap">
                    {STATUSES.map((s) => (
                      <Button
                        key={s.value}
                        type="button"
                        variant={status === s.value ? "default" : "outline"}
                        size="sm"
                        className="min-w-[88px] touch-manipulation"
                        onClick={() => handleSetStatus(lid, s.value)}
                      >
                        {s.icon}
                        <span className="ml-1 hidden sm:inline">{s.label}</span>
                        <span className="ml-1 sm:hidden">{s.short}</span>
                      </Button>
                    ))}
                  </div>
                  {status === "absent" && (
                    <Select
                      value={rec?.absenceType ?? "unexcused"}
                      disabled={isCoachReadOnly}
                      onValueChange={(v: "excused" | "unexcused") =>
                        handleSetStatus(lid, "absent", v)
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excused">Excused</SelectItem>
                        <SelectItem value="unexcused">Unexcused</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {status === "excused" && (
                    <span className="text-xs text-muted-foreground">Excused absence</span>
                  )}
                  <div className="flex items-center gap-1" title="Stars (0–3)">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {[1, 2, 3].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        variant={stars >= n ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isCoachReadOnly}
                        onClick={() => handleSetStars(lid, stars >= n ? n - 1 : n)}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                  {!isCoachReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLearnerIdForBadge(lid)}
                      className="shrink-0"
                    >
                      <Award className="w-4 h-4 mr-1" /> Give badge
                    </Button>
                  )}
                </div>
                {sessionBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sessionBadges.map((a) => {
                      const def = BADGE_DEFINITIONS.find((b) => b.id === a.badgeId);
                      return (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          title={def?.description}
                        >
                          <Award className="w-3 h-3" /> {def?.label ?? a.badgeId}
                        </span>
                      );
                    })}
                  </div>
                )}
                <Input
                  placeholder="Note (optional)"
                  className="flex-1 min-w-0 text-sm max-w-md"
                  defaultValue={rec?.notes}
                  readOnly={isCoachReadOnly}
                  onBlur={(e) => !isCoachReadOnly && handleNotesChange(lid, e.target.value.trim())}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Give badge dialog */}
      <Dialog open={!!learnerIdForBadge} onOpenChange={(open) => !open && setLearnerIdForBadge(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Give badge</DialogTitle>
            <DialogDescription>
              {learnerIdForBadge && (() => {
                const l = getLearner(learnerIdForBadge);
                return l ? `${l.firstName} ${l.lastName}` : learnerIdForBadge;
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose a badge to award. You can add a short note (optional).</p>
            <Textarea
              placeholder="Note (optional, max 140 chars)"
              maxLength={BADGE_NOTE_MAX}
              value={badgeNote}
              onChange={(e) => setBadgeNote(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="grid gap-2">
              {BADGE_DEFINITIONS.map((def) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => learnerIdForBadge && handleGiveBadge(learnerIdForBadge, def.id, badgeNote || undefined)}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{def.label}</span>
                  <span className="text-xs text-muted-foreground">{def.description}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!isCoachReadOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button onClick={handleSaveAttendance}>
            <Save className="w-4 h-4 mr-2" /> Save attendance
          </Button>
          <p className="text-xs text-muted-foreground">
            Changes are stored as you edit; click Save to confirm and record timestamp for audit.
          </p>
        </div>
      )}
    </div>
  );
}

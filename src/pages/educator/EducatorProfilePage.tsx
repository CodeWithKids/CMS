import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getClass } from "@/mockData";
import { PRESET_AVATARS, getPresetAvatar } from "@/data/presetAvatars";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSessions } from "@/context/SessionsContext";
import { getEducatorBadgesForEducator } from "@/mockData/educator";
import { filterSessionsByPeriod, type PeriodFilter } from "@/utils/period";
import { computeEducatorBadges } from "@/utils/educatorBadges";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack, Session, SessionType } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserCircle, Clock, BookOpen, Award, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, sessionsGetAll, classesGetAll, educatorBadgesGetAll, type EducatorBadgeApi } from "@/lib/api";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "this_term", label: "This term" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
];

export default function EducatorProfilePage() {
  const { currentUser, updateUser } = useAuth();
  const { toast } = useToast();
  const { getSessionsForEducatorByRole } = useSessions();
  const educatorId = currentUser?.id ?? "";
  const [period, setPeriod] = useState<PeriodFilter>("this_term");
  const currentAvatar = currentUser?.avatarId ? getPresetAvatar(currentUser.avatarId) : null;

  const apiEnabled = isApiEnabled();
  const { data: apiSessions = [] } = useQuery({
    queryKey: ["educator", "sessions", "profile", educatorId],
    queryFn: () => sessionsGetAll({ educatorId }),
    enabled: apiEnabled && !!educatorId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: apiClasses = [] } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: () => classesGetAll(),
    enabled: apiEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: apiBadges = [] } = useQuery({
    queryKey: ["educator", "badges", educatorId],
    queryFn: () => educatorBadgesGetAll(educatorId),
    enabled: apiEnabled && !!educatorId,
    staleTime: 5 * 60 * 1000,
  });

  const classMap = useMemo(() => {
    if (!apiEnabled) return null as Map<string, { name: string; location: string }> | null;
    const map = new Map<string, { name: string; location: string }>();
    apiClasses.forEach((c) => {
      map.set(c.id, { name: c.name, location: c.location });
    });
    return map;
  }, [apiEnabled, apiClasses]);

  const allSessions = useMemo(
    (): Session[] =>
      apiEnabled && educatorId
        ? apiSessions.map((s) => ({
            id: s.id,
            classId: s.classId,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            topic: s.topic,
            sessionType: s.sessionType as SessionType,
            duration: "1_hour",
            learningTrack: s.learningTrack as LearningTrack,
            termId: s.termId,
            leadEducatorId: s.leadEducatorId,
            assistantEducatorIds: s.assistantEducatorIds ?? [],
            durationHours: s.durationHours ?? 1,
          }))
        : getSessionsForEducatorByRole(educatorId, { from: "2000-01-01", to: "2099-12-31" }),
    [apiEnabled, educatorId, apiSessions, getSessionsForEducatorByRole]
  );

  const sessionsInPeriod = useMemo(
    () => filterSessionsByPeriod(allSessions, period),
    [allSessions, period]
  );

  const facilitatorSessions = useMemo(
    () => sessionsInPeriod.filter((s) => s.leadEducatorId === educatorId),
    [sessionsInPeriod, educatorId]
  );
  const coachSessions = useMemo(
    () => sessionsInPeriod.filter((s) => (s.assistantEducatorIds ?? []).includes(educatorId)),
    [sessionsInPeriod, educatorId]
  );

  const hours = useMemo(() => {
    let facilitating = 0;
    let coaching = 0;
    for (const s of sessionsInPeriod) {
      const h = s.durationHours ?? 1;
      if (s.leadEducatorId === educatorId) facilitating += h;
      else coaching += h;
    }
    return { facilitating, coaching };
  }, [sessionsInPeriod, educatorId]);

  const tracksFacilitated = useMemo(() => {
    const map = new Map<LearningTrack, { sessions: number; hours: number }>();
    for (const s of facilitatorSessions) {
      const t = s.learningTrack;
      const cur = map.get(t) ?? { sessions: 0, hours: 0 };
      cur.sessions += 1;
      cur.hours += s.durationHours ?? 1;
      map.set(t, cur);
    }
    return Array.from(map.entries()).map(([track, data]) => ({ track, ...data })).sort((a, b) => b.sessions - a.sessions);
  }, [facilitatorSessions]);

  const computedBadges = useMemo(
    () => computeEducatorBadges(educatorId, allSessions),
    [educatorId, allSessions]
  );

  const staticBadges = useMemo(() => {
    if (apiEnabled) {
      return (apiBadges as EducatorBadgeApi[]).map((b) => ({
        id: b.id,
        educatorId: b.educatorId,
        trackId: b.trackId ?? undefined,
        name: b.badgeId,
        description: "",
        earnedAt: b.earnedAt,
      }));
    }
    return getEducatorBadgesForEducator(educatorId);
  }, [apiEnabled, apiBadges, educatorId]);

  const badges = useMemo(() => {
    const byTrack = new Set(computedBadges.map((b) => b.trackId).filter(Boolean));
    return [
      ...computedBadges,
      ...staticBadges.filter((s) => !s.trackId || !byTrack.has(s.trackId)),
    ];
  }, [computedBadges, staticBadges]);

  const handleSelectAvatar = (avatarId: string) => {
    updateUser({ avatarId });
    toast({
      title: "Avatar updated",
      description: "Your profile avatar has been saved. It will appear on Team profiles.",
    });
  };

  if (currentUser?.role !== "educator") {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">This page is for educators.</p>
        <Link to="/educator/dashboard" className="text-primary hover:underline text-sm">← Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title flex items-center gap-2">
        <UserCircle className="w-6 h-6" /> Educator profile
      </h1>
      <p className="page-subtitle text-muted-foreground mb-6">
        Your sessions, hours, tracks, and badges.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
          <CardDescription>Your account and roles</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 rounded-xl border-2 border-muted">
            {currentAvatar ? (
              <AvatarImage src={currentAvatar.imageUrl} alt={currentAvatar.description} className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 min-w-0">
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">{currentUser.email ?? "—"}</p>
            {currentAvatar && (
              <p className="text-xs text-muted-foreground">{currentAvatar.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-sm font-medium">Educator</span>
              {coachSessions.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-sm">Coach</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Choose your avatar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Choose your avatar</CardTitle>
          <CardDescription>
            Select one of the approved preset avatars. Your choice appears on your profile and on Team profiles (admin view). You can change it anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = currentUser.avatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleSelectAvatar(avatar.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                    "hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Select avatar: ${avatar.description}`}
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.description}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" /> Educator badges
          </CardTitle>
          <CardDescription>Track mastery and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No badges earned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {badges.map((b) => (
                <div key={b.id} className="p-4 rounded-lg border bg-muted/30 min-w-[200px]">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Earned {new Date(b.earnedAt).toLocaleDateString("en-ZA")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Hours taught
          </CardTitle>
          <CardDescription>Facilitating and coaching hours ({PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-semibold">{hours.facilitating}h</p>
              <p className="text-sm text-muted-foreground">Facilitating</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{hours.coaching}h</p>
              <p className="text-sm text-muted-foreground">Coaching</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Learning tracks facilitated
          </CardTitle>
          <CardDescription>Sessions and hours per track (facilitator only)</CardDescription>
        </CardHeader>
        <CardContent>
          {tracksFacilitated.length === 0 ? (
            <p className="text-sm text-muted-foreground">No facilitating sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {tracksFacilitated.map(({ track, sessions, hours: h }) => (
                <li key={track} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="font-medium">{LEARNING_TRACK_LABELS[track] ?? track}</span>
                  <span className="text-muted-foreground text-sm">{sessions} sessions · {h}h</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Sessions history</CardTitle>
              <CardDescription>Total and by role for selected period</CardDescription>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-2xl font-semibold">{sessionsInPeriod.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total sessions</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{facilitatorSessions.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">As facilitator</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{coachSessions.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">As coach</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsInPeriod.slice(0, 20).map((s) => {
                  const cls = apiEnabled && classMap ? classMap.get(s.classId) : getClass(s.classId);
                  const role = s.leadEducatorId === educatorId ? "Facilitator" : "Coach";
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>{cls?.name ?? s.classId}</TableCell>
                      <TableCell className="text-muted-foreground">{cls?.location ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{LEARNING_TRACK_LABELS[s.learningTrack] ?? s.learningTrack}</TableCell>
                      <TableCell>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${role === "Facilitator" ? "bg-primary/15 text-primary" : "bg-muted"}`}>
                          {role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link to={`/educator/sessions/${s.id}/report`} className="text-primary hover:underline text-sm">Report</Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {sessionsInPeriod.length > 20 && (
            <p className="text-sm text-muted-foreground mt-2">Showing latest 20 sessions.</p>
          )}
          {sessionsInPeriod.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No sessions in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

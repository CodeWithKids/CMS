import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import { getTodaySessionsForStudent, getClass, mockEvents, getLearnerByUserId } from "@/mockData";
import { Clock, Calendar, ExternalLink, User, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const platformLinks = [
  { name: "Scratch", url: "https://scratch.mit.edu", color: "bg-amber-500" },
  { name: "Typing.com", url: "https://www.typing.com", color: "bg-blue-500" },
  { name: "Tinkercad", url: "https://www.tinkercad.com", color: "bg-teal-500" },
  { name: "Roblox", url: "https://www.roblox.com/create", color: "bg-red-500" },
  { name: "PyGolfers", url: "https://www.pygolfers.com", color: "bg-green-600" },
];

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const learner = currentUser?.role === "student" && currentUser?.id ? getLearnerByUserId(currentUser.id) : null;
  const learnerId = learner?.id ?? null;

  const todaySessions = learnerId ? getTodaySessionsForStudent(learnerId) : [];
  const studentEvents = mockEvents.filter((e) => e.target === "students");
  const { getByLearner: getBadgeAwardsByLearner } = useBadgeAwards();
  const badgeAwards = learnerId ? getBadgeAwardsByLearner(learnerId) : [];
  const badgeSummary = (() => {
    const byType: Record<string, number> = {};
    for (const a of badgeAwards) {
      byType[a.badgeId] = (byType[a.badgeId] ?? 0) + 1;
    }
    return { total: badgeAwards.length, byType };
  })();

  const needsAvatar = currentUser?.role === "student" && !currentUser?.avatarId;

  return (
    <div className="page-container">
      <h1 className="page-title">Student Dashboard</h1>
      <p className="page-subtitle">Welcome back, {currentUser?.name}! 🚀</p>

      {needsAvatar && (
        <div className="mb-6 p-4 rounded-xl border bg-primary/5 border-primary/20 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-medium">
            Choose your avatar to complete your profile. Only preset avatars are allowed (no photo uploads).
          </p>
          <Button asChild size="sm">
            <Link to="/student/profile" className="inline-flex items-center gap-2">
              <User className="w-4 h-4" /> Choose avatar
            </Link>
          </Button>
        </div>
      )}

      {/* Badges earned */}
      <div className="mb-6 bg-card rounded-xl border p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-500" /> Badges you&apos;ve earned
        </h2>
        {badgeSummary.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No badges yet. Earn badges in sessions when your educator awards them for things like Problem Solver, Team Player, or Creativity.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              You have earned <span className="font-semibold text-foreground">{badgeSummary.total}</span> badge{badgeSummary.total !== 1 ? "s" : ""} so far.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(badgeSummary.byType).map(([badgeId, count]) => {
                const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
                return (
                  <Badge
                    key={badgeId}
                    variant="secondary"
                    className="text-xs font-normal py-1.5 px-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/20"
                    title={def?.description}
                  >
                    {def?.label ?? badgeId}
                    {count > 1 ? ` ×${count}` : ""}
                  </Badge>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Sessions */}
        <div className="bg-card rounded-xl border p-5 md:col-span-2 lg:col-span-1">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-accent" /> Today's Sessions
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions today. Enjoy your day! 🎉</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s) => {
                const cls = getClass(s.classId);
                return (
                  <div key={s.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{cls?.name}</p>
                    <p className="text-xs text-muted-foreground">{s.startTime} – {s.endTime}</p>
                    <p className="text-xs text-muted-foreground">{s.topic}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-2">
            {platformLinks.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
              >
                <div className={`w-3 h-3 rounded-full ${p.color}`} />
                {p.name}
                <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" /> Upcoming Events
          </h2>
          <div className="space-y-3">
            {studentEvents.map((e) => (
              <div key={e.id} className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} at {e.time}</p>
                <p className="text-xs text-muted-foreground">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

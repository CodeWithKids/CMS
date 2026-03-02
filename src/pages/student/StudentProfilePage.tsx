import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import { getLearnerByUserId } from "@/mockData";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import { PRESET_AVATARS, getPresetAvatar } from "@/data/presetAvatars";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Check, Award, BookOpen, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PLATFORM_LINKS = [
  { name: "Scratch", url: "https://scratch.mit.edu", color: "bg-amber-500" },
  { name: "Typing.com", url: "https://www.typing.com", color: "bg-blue-500" },
  { name: "Tinkercad", url: "https://www.tinkercad.com", color: "bg-teal-500" },
  { name: "Roblox", url: "https://www.roblox.com/create", color: "bg-red-500" },
  { name: "PyGolfers", url: "https://www.pygolfers.com", color: "bg-green-600" },
];

export default function StudentProfilePage() {
  const { currentUser, updateUser } = useAuth();
  const { toast } = useToast();
  const { getByLearner: getBadgeAwardsByLearner } = useBadgeAwards();
  const currentAvatar = currentUser?.avatarId ? getPresetAvatar(currentUser.avatarId) : null;
  const learner =
    currentUser?.role === "student" && currentUser?.id
      ? getLearnerByUserId(currentUser.id)
      : null;
  const learnerId = learner?.id ?? null;
  const badgeAwards = learnerId ? getBadgeAwardsByLearner(learnerId) : [];
  const badgeByType = (() => {
    const by: Record<string, number> = {};
    badgeAwards.forEach((a) => {
      by[a.badgeId] = (by[a.badgeId] ?? 0) + 1;
    });
    return by;
  })();

  if (!currentUser || currentUser.role !== "student") {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">This page is for students only.</p>
      </div>
    );
  }

  const handleSelectAvatar = (avatarId: string) => {
    updateUser({ avatarId });
    toast({
      title: "Avatar updated",
      description: "Your profile avatar has been saved.",
    });
  };

  return (
    <div className="page-container max-w-3xl">
      <h1 className="page-title flex items-center gap-2">
        <User className="w-7 h-7" /> My profile
      </h1>
      <p className="page-subtitle">
        Your avatar, achievements, and quick links. Only approved avatars are allowed (no photo uploads).
      </p>

      {/* About you + current avatar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">About you</CardTitle>
          <CardDescription>Your account and learner info</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex items-center justify-center shrink-0 border-2 border-muted">
            {currentAvatar ? (
              <img
                src={currentAvatar.imageUrl}
                alt={currentAvatar.description}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1 min-w-0">
            <p className="font-semibold text-lg">{currentUser.name}</p>
            {currentAvatar && (
              <p className="text-sm text-muted-foreground">{currentAvatar.description}</p>
            )}
            {currentUser.email && (
              <p className="text-sm text-muted-foreground truncate">{currentUser.email}</p>
            )}
            {learner && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="font-normal">
                  {learner.school}
                </Badge>
                <Badge variant="outline" className="font-normal capitalize">
                  {learner.programType.replace(/_/g, " ")}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Badges earned */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-5 h-5 text-amber-500" /> Badges you&apos;ve earned
          </CardTitle>
          <CardDescription>Recognitions from your educators in sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {badgeAwards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No badges yet. Earn badges in sessions when your educator awards them.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(badgeByType).map(([badgeId, count]) => {
                const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
                return (
                  <Badge
                    key={badgeId}
                    variant="secondary"
                    className="py-1.5 px-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/20 font-normal"
                    title={def?.description}
                  >
                    {def?.label ?? badgeId}
                    {count > 1 ? ` ×${count}` : ""}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Choose your avatar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Choose your avatar</CardTitle>
          <CardDescription>
            Select one of the approved preset avatars below. You can change it anytime. No personal photos.
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

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5 text-primary" /> Quick links
          </CardTitle>
          <CardDescription>Your timetable and learning platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">CWK Hub</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/student/timetable" className="inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> My timetable
              </Link>
            </Button>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Learning platforms</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORM_LINKS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors text-sm font-medium"
                >
                  <div className={cn("w-3 h-3 rounded-full shrink-0", p.color)} />
                  {p.name}
                  <ExternalLink className="w-3.5 h-3.5 ml-auto text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

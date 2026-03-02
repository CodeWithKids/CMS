import { useParams, Link } from "react-router-dom";
import {
  getStaffMember,
  getCurrentTerm,
  getSessionsForTerm,
  mockSessions,
  mockStaff,
} from "@/mockData";
import { getEducatorBadgesForEducator } from "@/mockData/educator";
import { computeEducatorBadges } from "@/utils/educatorBadges";
import { useInventory } from "@/context/InventoryContext";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PRESET_AVATARS } from "@/data/presetAvatars";
import { ArrowLeft, Award, Clock, Calendar, Package, UserCircle } from "lucide-react";

function getEducatorAvatarUrl(index: number): string {
  const preset = PRESET_AVATARS[index % PRESET_AVATARS.length];
  return preset?.imageUrl ?? "";
}

export default function EducatorProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const educatorId = id ?? "";
  const staff = getStaffMember(educatorId);
  const { getItemsCheckedOutTo } = useInventory();

  const currentTerm = getCurrentTerm();
  const termId = currentTerm?.id ?? "t1";
  const allSessions = mockSessions.filter(
    (s) => s.leadEducatorId === educatorId || (s.assistantEducatorIds ?? []).includes(educatorId)
  );
  const sessionsThisTerm = getSessionsForTerm(termId).filter(
    (s) =>
      s.leadEducatorId === educatorId || (s.assistantEducatorIds ?? []).includes(educatorId)
  );
  const facilitatingHours = sessionsThisTerm
    .filter((s) => s.leadEducatorId === educatorId)
    .reduce((sum, s) => sum + (s.durationHours ?? 1), 0);
  const coachingHours = sessionsThisTerm
    .filter((s) => (s.assistantEducatorIds ?? []).includes(educatorId))
    .reduce((sum, s) => sum + (s.durationHours ?? 1), 0);
  const totalHours = facilitatingHours + coachingHours;

  const staticBadges = getEducatorBadgesForEducator(educatorId);
  const computedBadges = computeEducatorBadges(educatorId, allSessions);
  const byTrack = new Set(computedBadges.map((b) => b.trackId).filter(Boolean));
  const badges = [
    ...computedBadges,
    ...staticBadges.filter((b) => !b.trackId || !byTrack.has(b.trackId)),
  ];

  const devicesCheckedOut = getItemsCheckedOutTo(educatorId);

  const educators = mockStaff.filter((s) => s.role === "educator");
  const educatorIndex = educators.findIndex((s) => s.id === educatorId);

  if (!staff || staff.role !== "educator") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Educator not found.</p>
        <Link to="/admin/educator-profiles" className="text-primary hover:underline text-sm">
          ← Back to team profiles
        </Link>
      </div>
    );
  }

  const avatarUrl = getEducatorAvatarUrl(educatorIndex >= 0 ? educatorIndex : 0);

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Team profiles", href: "/admin/educator-profiles" },
          { label: staff.name },
        ]}
        className="mb-4"
      />
      <Link
        to="/admin/educator-profiles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to team profiles
      </Link>

      {/* Profile header: avatar + name */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={avatarUrl} alt="" />
              <AvatarFallback className="text-lg font-medium">
                {staff.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UserCircle className="w-5 h-5" /> {staff.name}
              </CardTitle>
              <CardDescription>Educator profile</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" /> Badges
          </CardTitle>
          <CardDescription>Track mastery and achievements.</CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No badges yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg border bg-muted/30 min-w-[180px]"
                >
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earned {new Date(b.earnedAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hours & sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Hours & sessions
          </CardTitle>
          <CardDescription>
            {currentTerm?.name ?? "Current term"} — facilitating and coaching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Total sessions (this term)
              </p>
              <p className="text-2xl font-semibold">{sessionsThisTerm.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Facilitating hours
              </p>
              <p className="text-2xl font-semibold">{facilitatingHours.toFixed(1)} h</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Coaching hours
              </p>
              <p className="text-2xl font-semibold">{coachingHours.toFixed(1)} h</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Total: {totalHours.toFixed(1)} h this term
          </p>
        </CardContent>
      </Card>

      {/* Devices checked out */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> Devices checked out
          </CardTitle>
          <CardDescription>Inventory items currently checked out to this educator.</CardDescription>
        </CardHeader>
        <CardContent>
          {devicesCheckedOut.length === 0 ? (
            <p className="text-sm text-muted-foreground">No devices checked out.</p>
          ) : (
            <ul className="space-y-2">
              {devicesCheckedOut.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {item.checkedOutAt
                      ? new Date(item.checkedOutAt).toLocaleDateString("en-ZA")
                      : "—"}
                    {item.dueAt && ` · Due ${new Date(item.dueAt).toLocaleDateString("en-ZA")}`}
                  </span>
                  <Link to={`/inventory/${item.id}`} className="text-primary hover:underline text-xs">
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

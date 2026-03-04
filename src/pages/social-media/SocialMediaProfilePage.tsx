import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Share2, LayoutDashboard, Megaphone, BookOpen, CalendarDays } from "lucide-react";

const TEAM_RESPONSIBILITIES = [
  "Create and schedule social content aligned with campaigns and brand kit",
  "Maintain brand visibility across Facebook, Instagram, and other channels",
  "Coordinate with Marketing on campaigns and with Partnerships on events",
  "Submit posts for review when required; publish once approved",
];

export default function SocialMediaProfilePage() {
  const { currentUser } = useAuth();

  if (!currentUser || currentUser.role !== "social_media") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">This page is for the Social Media team.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/social-media/dashboard">← Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your Social Media account, team context, and responsibilities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" /> Who is on the team
          </CardTitle>
          <CardDescription>Your account and role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{currentUser.name}</p>
          <p className="text-sm text-muted-foreground">{currentUser.email ?? "—"}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-sm font-medium">
              Social Media
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsibilities</CardTitle>
          <CardDescription>What the Social Media team owns</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
            {TEAM_RESPONSIBILITIES.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Shortcuts to key areas</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/social-media/dashboard" className="inline-flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/social-media/content" className="inline-flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Content and posts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/marketing/brand-kit" className="inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Brand Kit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/events" className="inline-flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Events
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/marketing/campaigns" className="inline-flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Campaigns
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/social-media/analytics" className="inline-flex items-center gap-2">
              Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

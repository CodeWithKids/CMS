import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { MOCK_MARKETING_ORG_COVERAGE } from "@/data/marketingCommandCenter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, MapPin, BookOpen, Megaphone, LayoutDashboard } from "lucide-react";

export default function MarketingProfilePage() {
  const { currentUser } = useAuth();

  if (!currentUser || currentUser.role !== "marketing") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">This page is for the Marketing & Strategy role.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/marketing/dashboard">← Dashboard</Link>
        </Button>
      </div>
    );
  }

  const { locations, programmes } = MOCK_MARKETING_ORG_COVERAGE;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your Marketing & Strategy account and coverage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" /> Basic info
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{currentUser.name}</p>
          <p className="text-sm text-muted-foreground">{currentUser.email ?? "—"}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-sm font-medium">
              Marketing & Strategy
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Coverage
          </CardTitle>
          <CardDescription>Locations and programmes you cover</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Locations</p>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <span
                  key={loc}
                  className="px-2.5 py-1 rounded-md bg-muted text-sm"
                >
                  {loc}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Programmes</p>
            <div className="flex flex-wrap gap-2">
              {programmes.map((prog) => (
                <span
                  key={prog}
                  className="px-2.5 py-1 rounded-md bg-muted text-sm"
                >
                  {prog}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Shortcuts to key areas</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/marketing/dashboard" className="inline-flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/marketing/campaigns" className="inline-flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Campaigns
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/marketing/brand-kit" className="inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Brand Kit
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

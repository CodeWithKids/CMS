import { Link } from "react-router-dom";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { Users, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrganisationDashboardPage() {
  const { organisation, learners, isOrgUser } = useOrganisationLearners();

  if (!isOrgUser || !organisation) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Organisation not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Organisation portal</h1>
      <p className="page-subtitle">Welcome, {organisation.name}</p>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your organisation</p>
                <p className="font-semibold">{organisation.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{organisation.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Learners</p>
                  <p className="text-2xl font-bold">{learners.length}</p>
                  <p className="text-sm text-muted-foreground">learners linked to your organisation</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/organisation/learners">
                  View learners
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

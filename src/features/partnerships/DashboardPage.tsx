import { Link } from "react-router-dom";
import { usePartnerships } from "@/context/PartnershipsContext";
import { useMarketing } from "@/context/MarketingContext";
import { useProspectsStore } from "./stores/prospectsStore";
import { useGrantsStore } from "./stores/grantsStore";
import { useReceivedDonations } from "./stores/receivedDonationsStore";
import { useState } from "react";
import { Users, Handshake, Megaphone, UserPlus, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RoleResponsibilitiesCard } from "@/components/RoleResponsibilitiesCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const currentYear = new Date().getFullYear();

export default function PartnershipsDashboardPage() {
  const { partnerships } = usePartnerships();
  const { campaigns } = useMarketing();
  const { prospects } = useProspectsStore();
  const { opportunities } = useGrantsStore();
  const { getDonationsForYear } = useReceivedDonations();

  const activePartners = partnerships.filter((p) => p.status === "active").length;
  const partnershipIds = new Set(partnerships.map((p) => p.id));
  const linkedCampaignsCount = campaigns.filter(
    (c) => c.partnershipId && partnershipIds.has(c.partnershipId)
  ).length;

  const activeProspects = prospects.filter(
    (p) => p.stage !== "CONVERTED" && p.stage !== "LOST"
  ).length;
  const activeOpportunities = opportunities.filter(
    (o) => o.stage !== "AWARDED" && o.stage !== "DECLINED"
  ).length;
  const securedFromGrants = opportunities
    .filter((o) => o.stage === "AWARDED" && o.awardedDate?.startsWith(String(currentYear)))
    .reduce((sum, o) => sum + (o.amountKes ?? 0), 0);
  const donationsThisYear = getDonationsForYear(currentYear).reduce(
    (sum, d) => sum + d.amountKes,
    0
  );
  const securedThisYear = securedFromGrants + donationsThisYear;

  const [loadError, setLoadError] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partnership & Communications</h1>
        <p className="text-muted-foreground">
          Manage active partnerships, prospects, and funding.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load the dashboard.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setLoadError(false)}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}

      <RoleResponsibilitiesCard />

      {/* KPI row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">Total partners</p>
            <p className="text-2xl font-bold">{partnerships.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">Active partners</p>
            <p className="text-2xl font-bold">{activePartners}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">Active prospects</p>
            <p className="text-2xl font-bold">{activeProspects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">Funds secured this year</p>
            <p className="text-2xl font-bold">KES {securedThisYear.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Handshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active partnerships</p>
                <p className="text-2xl font-bold">{activePartners}</p>
                <p className="text-sm text-muted-foreground">of {partnerships.length} total</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Partnerships</p>
                  <p className="text-2xl font-bold">{partnerships.length}</p>
                  <p className="text-sm text-muted-foreground">Add and manage all active partnerships</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/partnerships">View & add partnerships</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prospects</p>
                  <p className="text-xs text-muted-foreground">Potential partners and supporters</p>
                  <p className="text-2xl font-bold mt-1">
                    {activeProspects} active (of {prospects.length} total)
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/partnerships/prospects">View prospects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grants & funding</p>
                  <p className="text-xs text-muted-foreground">Open opportunities and awards</p>
                  <p className="text-2xl font-bold mt-1">{activeOpportunities} active</p>
                  {securedThisYear > 0 && (
                    <p className="text-sm text-muted-foreground">
                      KES {securedThisYear.toLocaleString()} secured this year
                    </p>
                  )}
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/partnerships/grants">View grants & funding</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaigns linked to your partnerships</p>
                  <p className="text-2xl font-bold">{linkedCampaignsCount}</p>
                  <p className="text-sm text-muted-foreground">Marketing & Strategies can link campaigns to partnerships</p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/partnerships/campaigns">View linked campaigns</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { usePartnerships } from "@/context/PartnershipsContext";
import { useMarketing } from "@/context/MarketingContext";
import { Users, Handshake, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnershipsDashboardPage() {
  const { partnerships } = usePartnerships();
  const { campaigns } = useMarketing();
  const activeCount = partnerships.filter((p) => p.status === "active").length;
  const partnershipIds = new Set(partnerships.map((p) => p.id));
  const linkedCampaignsCount = campaigns.filter((c) => c.partnershipId && partnershipIds.has(c.partnershipId)).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partnership & Communications</h1>
        <p className="text-muted-foreground">
          Manage active partnerships and communications.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Handshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active partnerships</p>
                <p className="text-2xl font-bold">{activeCount}</p>
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

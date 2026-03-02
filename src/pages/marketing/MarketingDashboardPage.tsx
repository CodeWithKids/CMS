import { Link } from "react-router-dom";
import { useMarketing } from "@/context/MarketingContext";
import { Megaphone, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MarketingDashboardPage() {
  const { campaigns } = useMarketing();
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing & Strategies</h1>
        <p className="text-muted-foreground">
          Plan and track marketing campaigns and strategies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active campaigns</p>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">of {campaigns.length} total</p>
              </div>
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
                  <p className="text-sm font-medium text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                  <p className="text-sm text-muted-foreground">Add and manage marketing campaigns</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/marketing/campaigns">View & add campaigns</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

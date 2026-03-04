import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function RetentionAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Retention & churn</h1>
        <p className="text-muted-foreground">
          Executive and ops dashboards for retention, churn risk, and engagement metrics.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Retention dashboards coming soon</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                This page will show retention rates, churn risk scores, and engagement metrics. Linked from the AI Marketing Canvas and Stage 5 products.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to="/ai-marketing/overview">Back to AI Marketing</Link>
      </Button>
    </div>
  );
}

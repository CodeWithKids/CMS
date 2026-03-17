import { Link } from "react-router-dom";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import { getInvoicesForOrganisation } from "@/mockData";
import { RoleResponsibilitiesCard } from "@/components/RoleResponsibilitiesCard";
import { Users, Building2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrganisationDashboardPage() {
  const { organisation, learners, isOrgUser, organizationId } = useOrganisationLearners();
  const { getInvoices } = useFinanceAccount();
  const invoices = organizationId ? getInvoicesForOrganisation(getInvoices(), organizationId) : [];
  const outstandingCount = invoices.filter((i) => i.status !== "paid" && i.status !== "draft").length;

  if (!isOrgUser || !organisation) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-8 max-w-md">
          <p className="font-medium text-muted-foreground">Organisation not found</p>
          <p className="text-sm text-muted-foreground mt-1">Please contact Code With Kids support if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Organisation portal</h1>
      <p className="page-subtitle">Welcome, {organisation.name}</p>

      <div className="mb-6">
        <RoleResponsibilitiesCard />
      </div>

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
                <Link to="/organisation/learners">View learners</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invoices & receipts</p>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {outstandingCount > 0 ? `${outstandingCount} outstanding` : "View and download receipts"}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/organisation/invoices">View invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

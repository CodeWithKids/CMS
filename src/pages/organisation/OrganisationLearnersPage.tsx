import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { Search, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default function OrganisationLearnersPage() {
  const { organisation, learners, isOrgUser } = useOrganisationLearners();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter(
      (l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        l.school.toLowerCase().includes(q)
    );
  }, [learners, search]);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  if (!isOrgUser || !organisation) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Organisation not found. Please contact support.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80 mb-6" />
        <Skeleton className="h-10 max-w-sm mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Our learners</h1>
      <p className="page-subtitle">
        View details of learners linked to {organisation.name}
      </p>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load learners.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setIsError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or school..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">
            {learners.length === 0
              ? "No learners are currently linked to your organisation."
              : "No learners match your search."}
          </p>
          <p className="text-sm mt-1">
            {learners.length === 0 ? "Contact Code With Kids to link learners to your organisation." : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">School</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{l.firstName} {l.lastName}</td>
                  <td className="p-3 text-muted-foreground">{l.school}</td>
                  <td className="p-3">
                    <Badge variant={l.status === "active" ? "default" : "secondary"}>
                      {l.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/organisation/learners/${l.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

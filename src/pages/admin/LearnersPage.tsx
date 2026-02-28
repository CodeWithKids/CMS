import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { mockLearners, getOrganization } from "@/mockData";
import { Search, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LearnerEnrolmentType } from "@/types";

export default function LearnersPage() {
  const [search, setSearch] = useState("");
  const [enrolmentFilter, setEnrolmentFilter] = useState<LearnerEnrolmentType | "all">("all");
  const [isError, setIsError] = useState(false);

  const filtered = useMemo(() => {
    let list = mockLearners;
    if (enrolmentFilter !== "all") {
      list = list.filter((l) => l.enrolmentType === enrolmentFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
          l.school.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, enrolmentFilter]);

  return (
    <div className="page-container">
      <h1 className="page-title">Learners</h1>
      <p className="page-subtitle">Manage all registered learners (members and partner-org)</p>

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

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Select value={enrolmentFilter} onValueChange={(v) => setEnrolmentFilter(v as LearnerEnrolmentType | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Enrolment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="partner_org">Partner org</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>School</th>
            <th>Enrolment</th>
            <th>Contact (parent / org)</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((l) => {
            const org = l.enrolmentType === "partner_org" && l.organizationId ? getOrganization(l.organizationId) : null;
            const contact = l.enrolmentType === "member"
              ? `${l.parentName ?? "—"} · ${l.parentPhone ?? "—"} · ${l.parentEmail ?? "—"}`
              : org ? `${org.name} (${org.contactPerson})` : "—";
            return (
              <tr key={l.id}>
                <td className="font-medium">{l.firstName} {l.lastName}</td>
                <td>{l.school}</td>
                <td>
                  <Badge variant="outline">{l.enrolmentType === "member" ? "Member" : "Partner org"}</Badge>
                </td>
                <td className="text-sm text-muted-foreground max-w-[220px] truncate" title={contact}>{contact}</td>
                <td>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    l.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {l.status}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/admin/learners/${l.id}`}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-6">
          {search.trim() || enrolmentFilter !== "all"
            ? "No learners match your filters. Try changing the search or enrolment type."
            : "No learners in the system yet."}
        </p>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getPeopleStats,
  getFinanceStats,
  getLearnersWithPendingPayments,
  getOrganizationsWithPendingPayments,
  formatCurrency,
  type LearnerPaymentSummary,
} from "@/lib/financeUtils";
import { getAdminOverviewSummary } from "@/lib/adminOverview";
import {
  mockUsers,
  mockLearners,
  mockInvoices,
  mockOrganizations,
  mockSessions,
  mockSessionReports,
  mockClassEnrollments,
  getOrganization,
} from "@/mockData";
import type { AppUser } from "@/types";

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const pendingUsers = (): AppUser[] =>
  mockUsers.filter((u) => u.status === "pending");

const PARTNER_TYPE_LABELS: Record<string, string> = {
  SCHOOL: "School",
  ORGANISATION: "Organisation",
  MIRADI: "Miradi",
};

export default function AdminDashboardPage() {
  const peopleStats = getPeopleStats(mockUsers, mockLearners);
  const financeStats = getFinanceStats(mockInvoices, mockLearners);
  const pendingApprovals = pendingUsers();
  const learnersWithPending = getLearnersWithPendingPayments(
    mockLearners,
    mockInvoices,
    getOrganization
  );
  const organizationsWithPending = getOrganizationsWithPendingPayments(
    mockLearners,
    mockInvoices,
    getOrganization
  );

  const overview = useMemo(
    () =>
      getAdminOverviewSummary(
        mockOrganizations,
        mockLearners,
        mockSessions,
        mockSessionReports,
        mockClassEnrollments
      ),
    []
  );

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Operations overview: people, finance, and pending actions.
        </p>
      </div>

      {/* Overview: active partners */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Overview — active partners</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <StatCard title="Active schools" value={overview.activeSchools} />
          <StatCard title="Active organisations" value={overview.activeOrganisations} />
          <StatCard title="Active Miradi sites" value={overview.activeMiradis} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Partners</CardTitle>
            <CardDescription>
              Active organisations with learner counts (schools, organisations, Miradi).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview.partners.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No active partners.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Active learners</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.partners.map((p) => (
                    <TableRow key={p.organisationId}>
                      <TableCell className="font-medium">{p.organisationName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {PARTNER_TYPE_LABELS[p.type] ?? p.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{p.activeLearners}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Learning tracks: learner counts by track (from Learner.learningTrackId or inferred from session reports) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Learning tracks</h2>
        <Card>
          <CardHeader>
            <CardTitle>Learners by track</CardTitle>
            <CardDescription>
              Counts by learning track. Where a learner has no track set, it is inferred from recent session reports for that learner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {overview.learnersByTrack.map((row) => (
                <div
                  key={row.learningTrackId}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{row.learningTrackName}</span>
                  <span className="text-muted-foreground tabular-nums">{row.learnerCount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* People stats */}
      <section>
        <h2 className="text-lg font-semibold mb-3">People</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active learners" value={peopleStats.activeLearners} />
          <StatCard title="Active educators" value={peopleStats.activeEducators} />
          <StatCard title="Active parents" value={peopleStats.activeParents} />
          <StatCard
            title="Pending accounts"
            value={peopleStats.pendingAccounts}
            description="Awaiting approval"
          />
        </div>
      </section>

      {/* Finance stats */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Finance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total invoiced"
            value={formatCurrency(financeStats.totalInvoiced)}
          />
          <StatCard
            title="Total collected"
            value={formatCurrency(financeStats.totalCollected)}
          />
          <StatCard
            title="Total pending"
            value={formatCurrency(financeStats.totalPending)}
          />
          <StatCard
            title="Learners with pending payments"
            value={financeStats.learnersWithPendingPayments}
          />
        </div>
      </section>

      {/* Pending account approvals */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Pending account approvals</CardTitle>
            <CardDescription>
              Users awaiting approval. Manage in Account Approvals when available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No pending approvals.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email ?? "—"}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>
                        {user.createdAt
                          ? formatDate(user.createdAt)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Learners with pending payments */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Learners with pending payments</CardTitle>
            <CardDescription>
              Outstanding invoice amounts. Members: billed to parent; Partner org: billed to organisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {learnersWithPending.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No learners with pending payments.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Payer type</TableHead>
                    <TableHead>Payer / contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Invoiced</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learnersWithPending.map((row) => (
                    <LearnerPaymentRow key={row.learnerId} row={row} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Organisations with pending payments (partner_org learners) */}
      {organizationsWithPending.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Organisations with pending payments</CardTitle>
              <CardDescription>
                Partner schools/orgs with outstanding invoice amounts (billed per organisation).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationsWithPending.map((row) => (
                    <TableRow key={row.organizationId}>
                      <TableCell className="font-medium">{row.organizationName}</TableCell>
                      <TableCell>{row.contactPerson}</TableCell>
                      <TableCell>{row.contactPhone || "—"}</TableCell>
                      <TableCell>{row.contactEmail || "—"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.pendingAmount)}
                      </TableCell>
                      <TableCell>
                        {row.isOverdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function LearnerPaymentRow({ row }: { row: LearnerPaymentSummary }) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          to={`/admin/learners/${row.learnerId}`}
          className="text-primary hover:underline"
        >
          {row.learnerName}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{row.enrolmentType === "member" ? "Member" : "Partner org"}</Badge>
      </TableCell>
      <TableCell>{row.payerLabel}</TableCell>
      <TableCell>{row.payerPhone || "—"}</TableCell>
      <TableCell>{row.payerEmail || "—"}</TableCell>
      <TableCell className="text-right">
        {formatCurrency(row.totalInvoiced)}
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(row.totalPaid)}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(row.pendingAmount)}
      </TableCell>
      <TableCell>
        {row.isOverdue ? (
          <Badge variant="destructive">Overdue</Badge>
        ) : (
          <Badge variant="secondary">Pending</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Users, BookOpen, GraduationCap, Building2 } from "lucide-react";
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
import { useFinanceAccount } from "@/context/FinanceAccountContext";
import {
  mockUsers,
  mockLearners,
  mockOrganizations,
  mockSessions,
  mockSessionReports,
  mockClassEnrollments,
  getOrganization,
} from "@/mockData";
import type { AppUser } from "@/types";
import { RoleResponsibilitiesCard } from "@/components/RoleResponsibilitiesCard";
import { isApiEnabled, adminPendingSignupsGet, adminOverviewGet, focusAreasGetAll } from "@/lib/api";
import type { LearningTrack } from "@/types";
import { LEARNING_TRACK_LABELS } from "@/types";

function StatCard({
  title,
  value,
  description,
  to,
}: {
  title: string;
  value: string | number;
  description?: string;
  to?: string;
}) {
  const content = (
    <>
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
    </>
  );
  if (to) {
    return (
      <Card className="transition-colors hover:bg-muted/50">
        <Link to={to} className="block">
          {content}
        </Link>
      </Card>
    );
  }
  return <Card>{content}</Card>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { getInvoices } = useFinanceAccount();
  const invoices = getInvoices();
  const apiEnabled = isApiEnabled();
  const { data: pendingSignups = [] } = useQuery({
    queryKey: ["admin", "pending-signups"],
    queryFn: adminPendingSignupsGet,
    enabled: apiEnabled,
  });
  const {
    data: overviewApi,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: adminOverviewGet,
    enabled: apiEnabled,
  });

  const { data: focusAreas = [] } = useQuery({
    queryKey: ["focus-areas"],
    queryFn: focusAreasGetAll,
    enabled: apiEnabled,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // When API is enabled and overview is loaded, use real data; otherwise use mock
  const peopleStats = overviewApi
    ? overviewApi.peopleStats
    : getPeopleStats(mockUsers, mockLearners);
  const financeStats = overviewApi
    ? overviewApi.financeStats
    : getFinanceStats(invoices, mockLearners);
  const pendingApprovals = overviewApi
    ? overviewApi.pendingUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: "pending" as const,
        organizationId: null,
        membershipStatus: null,
        avatarId: null,
        createdAt: u.createdAt,
      }))
    : pendingUsers();
  const pendingSignupsCount = apiEnabled ? pendingSignups.length : 0;
  const totalPendingApprovals = overviewApi
    ? overviewApi.peopleStats.pendingAccounts + pendingSignupsCount
    : pendingApprovals.length + pendingSignupsCount;
  const learnersWithPending = overviewApi
    ? overviewApi.learnersWithPending
    : getLearnersWithPendingPayments(mockLearners, invoices, getOrganization);
  const organizationsWithPending = overviewApi
    ? overviewApi.organizationsWithPending
    : getOrganizationsWithPendingPayments(
        mockLearners,
        invoices,
        getOrganization
      );

  const overview = useMemo(() => {
    if (overviewApi) {
      return {
        activeSchools: overviewApi.activeSchools,
        activeOrganisations: overviewApi.activeOrganisations,
        activeMiradis: overviewApi.activeMiradis,
        partners: overviewApi.partners,
        learnersByTrack: overviewApi.learnersByTrack.map((row) => ({
          learningTrackId: row.learningTrackId as LearningTrack,
          learningTrackName:
            LEARNING_TRACK_LABELS[row.learningTrackId as LearningTrack] ??
            row.learningTrackName,
          learnerCount: row.learnerCount,
        })),
      };
    }
    return getAdminOverviewSummary(
      mockOrganizations,
      mockLearners,
      mockSessions,
      mockSessionReports,
      mockClassEnrollments
    );
  }, [overviewApi]);

  const learnersByFocusArea = useMemo(() => {
    if (focusAreas.length === 0) return [];
    const trackToCount = new Map(
      overview.learnersByTrack.map((r) => [r.learningTrackId, r.learnerCount])
    );
    return focusAreas.map((fa) => ({
      focusAreaId: fa.id,
      focusAreaName: fa.name,
      learnerCount: fa.tracks.reduce((sum, t) => sum + (trackToCount.get(t.id) ?? 0), 0),
    }));
  }, [focusAreas, overview.learnersByTrack]);

  const sessionReportsMissingCount = overviewApi
    ? overviewApi.sessionReportsMissingCount
    : (() => {
        const today = new Date().toISOString().split("T")[0];
        const submittedSessionIds = new Set(
          mockSessionReports.filter((r) => r.status === "submitted").map((r) => r.sessionId)
        );
        return mockSessions.filter(
          (s) => s.date < today && !submittedSessionIds.has(s.id)
        ).length;
      })();

  const showSkeleton = !apiEnabled ? isLoading : isLoading || overviewLoading;

  if (showSkeleton) {
    return (
      <div className="p-6 space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load the dashboard.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setIsError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {apiEnabled && overviewError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dashboard data unavailable</AlertTitle>
          <AlertDescription>
            Overview stats could not be loaded. You can try again or continue using the rest of the app.
            <Button
              variant="link"
              className="p-0 h-auto font-medium ml-1"
              onClick={() => refetchOverview()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Create, read, update, and delete: use quick actions and the links below to manage accounts, staff, classes, learners, and partners.
        </p>
      </div>

      <RoleResponsibilitiesCard />

      {/* Quick actions: Create, Read, Update, Delete */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create & manage</CardTitle>
            <CardDescription>
              Create new records or open lists to update and delete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/admin/create-team-member" className="gap-2">
                  <Plus className="h-4 w-4" /> Create account
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/classes" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Classes
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/learners" className="gap-2">
                  <GraduationCap className="h-4 w-4" /> Learners
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/hr/staff" className="gap-2">
                  <Users className="h-4 w-4" /> Staff directory
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/partnerships" className="gap-2">
                  <Building2 className="h-4 w-4" /> Partners
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/account-approvals" className="gap-2">
                  Account approvals
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pending actions summary */}
      {(sessionReportsMissingCount > 0 || totalPendingApprovals > 0) && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Pending actions</h2>
          <div className="flex flex-wrap gap-3">
            {sessionReportsMissingCount > 0 && (
              <Button asChild>
                <Link
                  to="/admin/session-reports?filter=missing"
                  className="inline-flex items-center gap-2"
                >
                  Review session reports
                  <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-medium">
                    {sessionReportsMissingCount} missing
                  </span>
                </Link>
              </Button>
            )}
            {totalPendingApprovals > 0 && (
              <Button asChild variant="outline">
                <Link to="/admin/account-approvals" className="inline-flex items-center gap-2">
                  Account approvals
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{totalPendingApprovals}</span>
                </Link>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Overview: active partners */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Overview — active partners</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <StatCard title="Active schools" value={overview.activeSchools} to="/partnerships" />
          <StatCard title="Active organisations" value={overview.activeOrganisations} to="/partnerships" />
          <StatCard title="Active Miradi sites" value={overview.activeMiradis} to="/partnerships" />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Partners</CardTitle>
              <CardDescription>
                Active organisations with learner counts (schools, organisations, Miradi).
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/partnerships">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overview.partners.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No active partners.</p>
            ) : (
              <div className="table-wrapper">
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
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Students by Focus Area (when API + focus areas available) */}
      {apiEnabled && learnersByFocusArea.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Students by focus area</h2>
          <Card>
            <CardHeader>
              <CardTitle>Learners by focus area</CardTitle>
              <CardDescription>
                Aggregated from session attendance by learning track. Use focus areas to see where learners are concentrated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {learnersByFocusArea.map((row) => (
                  <div
                    key={row.focusAreaId}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{row.focusAreaName}</span>
                    <span className="text-muted-foreground tabular-nums">{row.learnerCount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Learning tracks: learner counts by track (from session reports / class attendance) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Learning tracks</h2>
        <Card>
          <CardHeader>
            <CardTitle>Learners by track</CardTitle>
            <CardDescription>
              Based on session reports and class attendance. Counts may be 0 until sessions and reports are added.
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
          <StatCard title="Active learners" value={peopleStats.activeLearners} to="/admin/learners" />
          <StatCard title="Active educators" value={peopleStats.activeEducators} to="/admin/hr/staff" />
          <StatCard title="Active parents" value={peopleStats.activeParents} to="/partnerships" />
          <StatCard
            title="Pending accounts"
            value={peopleStats.pendingAccounts}
            description="Awaiting approval"
            to="/admin/account-approvals"
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
            to="/finance/invoices"
          />
          <StatCard
            title="Total collected"
            value={formatCurrency(financeStats.totalCollected)}
            to="/finance/income"
          />
          <StatCard
            title="Total pending"
            value={formatCurrency(financeStats.totalPending)}
            to="/finance/invoices"
          />
          <StatCard
            title="Learners with pending payments"
            value={financeStats.learnersWithPendingPayments}
            to="/admin/learners"
          />
        </div>
      </section>

      {/* Pending account approvals */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Pending account approvals</CardTitle>
              <CardDescription>
                Users awaiting approval. Approve or reject in Account Approvals.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/account-approvals">Manage approvals</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No pending approvals.
              </p>
            ) : (
              <div className="table-wrapper">
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
              </div>
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
              <div className="table-wrapper">
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
              </div>
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
              <div className="table-wrapper">
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
              </div>
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

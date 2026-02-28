import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLearnerAdminProfile } from "@/hooks/useLearnerAdminProfile";
import { useAttendance } from "@/context/AttendanceContext";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { getTerm, getSessionsForTerm, getSession, getClass, getCurrentTerm } from "@/mockData";
import { mockTerms } from "@/mockData";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import { ArrowLeft, User, Award, ClipboardList, Users } from "lucide-react";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  MAKERSPACE: "Makerspace",
  SCHOOL_CLUB: "School club",
  ORGANISATION: "Organisation",
};

const ENROLMENT_STATUS_LABELS: Record<string, string> = {
  CURRENT: "Current",
  COMPLETED: "Completed",
  WITHDRAWN: "Withdrawn",
};

function badgeLabel(badgeId: string): string {
  return BADGE_DEFINITIONS.find((b) => b.id === badgeId)?.label ?? badgeId;
}

export default function LearnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const profile = useLearnerAdminProfile(id ?? undefined);
  const { getByLearner } = useAttendance();
  const { getEnrollmentsForLearner } = useEnrollments();
  const currentTerm = getCurrentTerm();
  const [selectedTermId, setSelectedTermId] = useState(
    currentTerm?.id ?? mockTerms[0]?.id ?? ""
  );
  const termOptions = useMemo(
    () => mockTerms.map((t) => ({ term: t, label: t.name })),
    []
  );
  const attendanceRecords = id ? getByLearner(id) : [];
  const selectedTerm = getTerm(selectedTermId);
  const selectedTermSessionIds = selectedTerm
    ? new Set(getSessionsForTerm(selectedTermId).map((s) => s.id))
    : new Set<string>();
  const selectedTermRecords = attendanceRecords.filter((r) =>
    selectedTermSessionIds.has(r.sessionId)
  );
  const recentAttendanceForTerm = useMemo(() => {
    return selectedTermRecords
      .map((r) => ({ record: r, session: getSession(r.sessionId) }))
      .filter(
        (x): x is { record: (typeof selectedTermRecords)[0]; session: NonNullable<ReturnType<typeof getSession>> } =>
          !!x.session
      )
      .sort((a, b) => (b.session.date > a.session.date ? 1 : -1))
      .slice(0, 15)
      .map(({ record, session }) => {
        const cls = getClass(session.classId);
        const status: "present" | "absent" | "late" =
          record.status === "present" || record.status === "late"
            ? "present"
            : record.status === "absent" || record.status === "excused"
              ? "absent"
              : "late";
        return {
          sessionId: session.id,
          date: session.date,
          status,
          className: cls?.name ?? session.classId,
        };
      });
  }, [selectedTermRecords]);

  if (id === undefined) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Invalid learner ID.</p>
        <Link to="/admin/learners" className="text-primary hover:underline text-sm">
          ← Back to learners
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Learner not found.</p>
        <Link to="/admin/learners" className="text-primary hover:underline text-sm">
          ← Back to learners
        </Link>
      </div>
    );
  }

  const totalSessionsCurrentTerm =
    profile.presentCountCurrentTerm +
    profile.absentCountCurrentTerm +
    profile.lateCountCurrentTerm;
  const presentCountSelected = selectedTermRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const totalSessionsSelected = selectedTermRecords.length;
  const attendancePercentageSelected =
    totalSessionsSelected > 0
      ? Math.round((presentCountSelected / totalSessionsSelected) * 100)
      : 0;
  const enrollmentsForLearner = getEnrollmentsForLearner(id);
  const enrolledInSelectedTerm = enrollmentsForLearner.some(
    (e) => e.termId === selectedTermId
  );

  return (
    <div className="page-container max-w-4xl">
      <PageBreadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Learners", href: "/admin/learners" },
          { label: profile.fullName },
        ]}
        className="mb-4"
      />
      <Link
        to="/admin/learners"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to learners
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {profile.fullName.slice(0, 2).toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold truncate">{profile.fullName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {PROGRAM_TYPE_LABELS[profile.programType] ?? profile.programType}
                </Badge>
                <Badge
                  className={cn(
                    profile.status === "ACTIVE"
                      ? "bg-green-500/15 text-green-700 dark:text-green-400 border-0"
                      : "bg-muted text-muted-foreground border-0"
                  )}
                >
                  {profile.status}
                </Badge>
              </div>
              {(profile.schoolName || profile.organisationName) && (
                <p className="text-sm text-muted-foreground mt-2">
                  {[profile.schoolName, profile.organisationName].filter(Boolean).join(" · ")}
                </p>
              )}
              {(profile.dateOfBirth || profile.gender) && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[profile.dateOfBirth && `DOB: ${profile.dateOfBirth}`, profile.gender].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-5 h-5" /> Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{profile.totalBadges} total badges</p>
          {profile.totalBadges > 0 && Object.keys(profile.badgesByType).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(profile.badgesByType)
                .sort(([, a], [, b]) => b - a)
                .map(([badgeId, count]) => (
                  <Badge key={badgeId} variant="secondary" className="font-normal">
                    {badgeLabel(badgeId)} × {count}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance by term */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-5 h-5" /> Attendance by term
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map(({ term, label }) => (
                  <SelectItem key={term.id} value={term.id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!enrolledInSelectedTerm ? (
            <p className="text-muted-foreground">Not enrolled this term.</p>
          ) : totalSessionsSelected > 0 ? (
            <>
              <p className="text-3xl font-bold">{attendancePercentageSelected}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {presentCountSelected} present / {totalSessionsSelected} sessions in{" "}
                {selectedTerm?.name ?? "selected term"}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Enrolled this term; no attendance recorded yet.</p>
          )}
          {recentAttendanceForTerm.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-4 mb-2">Attendance – {selectedTerm?.name ?? "selected term"}</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttendanceForTerm.map((row) => (
                    <TableRow key={row.sessionId}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.className}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "capitalize",
                            row.status === "present" && "text-green-700 dark:text-green-400",
                            row.status === "absent" && "text-muted-foreground",
                            row.status === "late" && "text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enrolment history */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5" /> Enrolment history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.enrolments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrolment records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.enrolments.map((e, i) => (
                  <TableRow
                    key={`${e.termName}-${e.className}-${i}`}
                    className={e.status === "CURRENT" ? "bg-muted/30" : undefined}
                  >
                    <TableCell>{e.termName}</TableCell>
                    <TableCell>{e.className}</TableCell>
                    <TableCell>
                      <Badge
                        variant={e.status === "CURRENT" ? "default" : "secondary"}
                        className={cn(
                          e.status === "WITHDRAWN" && "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0"
                        )}
                      >
                        {ENROLMENT_STATUS_LABELS[e.status] ?? e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Optional: Membership (Makerspace) */}
      {profile.programType === "MAKERSPACE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-muted-foreground">Status:</span>{" "}
              {profile.membershipStatus ?? "—"}
            </p>
            {profile.parentName && (
              <p>
                <span className="font-medium text-muted-foreground">Parent:</span>{" "}
                {profile.parentName}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

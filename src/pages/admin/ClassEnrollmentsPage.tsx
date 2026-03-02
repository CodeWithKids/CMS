import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useBadgeAwards } from "@/context/BadgeAwardsContext";
import {
  getClass,
  getTerm,
  getEducatorName,
  getOrganization,
  getSessionsForClass,
  mockLearners,
} from "@/mockData";
import {
  getClassTrackLabel,
  getAttendancePctForLearnerInClass,
  getConflictOtherClassName,
  getBadgeCountInClassSessions,
} from "@/lib/classEnrolmentsUtils";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, Save, AlertTriangle, Award, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ClassEnrollmentStatus } from "@/types";
import type { Learner, LearnerProgramType } from "@/types";

const STATUS_OPTIONS: { value: ClassEnrollmentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "dropped", label: "Dropped" },
  { value: "completed", label: "Completed" },
];

const GENDER_OPTIONS = [
  { value: "", label: "All" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const PROGRAM_TYPE_OPTIONS: { value: "" | LearnerProgramType; label: string }[] = [
  { value: "", label: "All" },
  { value: "MAKERSPACE", label: "Makerspace" },
  { value: "SCHOOL_CLUB", label: "School club" },
  { value: "ORGANISATION", label: "Organisation" },
];

const ATTENDANCE_AT_RISK_THRESHOLD = 80;
const BADGE_HIGH_COUNT = 5;

function getSchoolOrOrgShort(learner: Learner): string {
  if (learner.organizationId) {
    const org = getOrganization(learner.organizationId);
    return org?.name ?? learner.school ?? "—";
  }
  return learner.school ?? "—";
}

export default function ClassEnrollmentsPage() {
  const { id: classId } = useParams<{ id: string }>();
  const { enrollments, getEnrollmentsForClass, addEnrollment, updateEnrollmentStatus } = useEnrollments();
  const { getBySession: getAttendanceBySession } = useAttendance();
  const { getBySession: getBadgesBySession } = useBadgeAwards();
  const { toast } = useToast();

  const cls = getClass(classId ?? "");
  const term = cls ? getTerm(cls.termId) : null;
  const enrollmentsForClassAndTerm = cls && term ? getEnrollmentsForClass(cls.id, term.id) : [];
  const classSessions = cls && term ? getSessionsForClass(cls.id).filter((s) => s.termId === term.id) : [];
  const classSessionIds = useMemo(() => classSessions.map((s) => s.id), [classSessions]);

  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [programTypeFilter, setProgramTypeFilter] = useState<"" | LearnerProgramType>("");
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({});
  const [statusByLearner, setStatusByLearner] = useState<Record<string, ClassEnrollmentStatus>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionValue, setBulkActionValue] = useState("");
  const [dropConfirmOpen, setDropConfirmOpen] = useState(false);

  useEffect(() => {
    if (!cls || !term) return;
    const forClassTerm = getEnrollmentsForClass(cls.id, term.id);
    const activeIds = new Set(forClassTerm.filter((e) => e.status === "active").map((e) => e.learnerId));
    const enrolledNext = mockLearners.reduce(
      (acc, l) => ({ ...acc, [l.id]: activeIds.has(l.id) }),
      {} as Record<string, boolean>
    );
    const statusNext: Record<string, ClassEnrollmentStatus> = {};
    mockLearners.forEach((l) => {
      statusNext[l.id] = "active";
    });
    forClassTerm.forEach((e) => {
      statusNext[e.learnerId] = e.status;
    });
    setEnrolled(enrolledNext);
    setStatusByLearner(statusNext);
  }, [cls?.id, term?.id, getEnrollmentsForClass]);

  const schoolOrgOptions = useMemo(() => {
    const set = new Set<string>();
    mockLearners.forEach((l) => {
      const name = getSchoolOrOrgShort(l);
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, []);

  const filteredLearners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockLearners.filter((l) => {
      if (q && !`${l.firstName} ${l.lastName}`.toLowerCase().includes(q) && !(l.school ?? "").toLowerCase().includes(q)) return false;
      if (schoolFilter && getSchoolOrOrgShort(l) !== schoolFilter) return false;
      if (genderFilter && (l.gender ?? "") !== genderFilter) return false;
      if (programTypeFilter && l.programType !== programTypeFilter) return false;
      return true;
    });
  }, [search, schoolFilter, genderFilter, programTypeFilter]);

  const effectiveActiveCount = useMemo(
    () =>
      Object.entries(enrolled).filter(
        ([id, isEnrolled]) => isEnrolled && (statusByLearner[id] ?? "active") === "active"
      ).length,
    [enrolled, statusByLearner]
  );

  const enrolledCount = useMemo(
    () => Object.entries(enrolled).filter(([, v]) => v).length,
    [enrolled]
  );

  const isOverCapacity = Boolean(
    cls?.capacity != null && effectiveActiveCount > cls.capacity
  );

  const handleToggleEnrolled = (learnerId: string, checked: boolean) => {
    setEnrolled((prev) => ({ ...prev, [learnerId]: checked }));
  };

  const handleStatusChange = (learnerId: string, status: ClassEnrollmentStatus) => {
    setStatusByLearner((prev) => ({ ...prev, [learnerId]: status }));
    setEnrolled((prev) => ({ ...prev, [learnerId]: status === "active" }));
  };

  const toggleSelected = (learnerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(learnerId)) next.delete(learnerId);
      else next.add(learnerId);
      return next;
    });
  };

  const selectAllOnPage = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filteredLearners.map((l) => l.id)));
    else setSelectedIds(new Set());
  };

  const applyBulkEnroll = () => {
    selectedIds.forEach((id) => {
      setEnrolled((prev) => ({ ...prev, [id]: true }));
      setStatusByLearner((prev) => ({ ...prev, [id]: "active" }));
    });
    setSelectedIds(new Set());
    toast({ title: "Bulk action", description: "Enroll selected applied. Click Save to persist." });
  };

  const applyBulkCompleted = () => {
    selectedIds.forEach((id) => {
      setStatusByLearner((prev) => ({ ...prev, [id]: "completed" }));
      setEnrolled((prev) => ({ ...prev, [id]: true }));
    });
    setSelectedIds(new Set());
    toast({ title: "Bulk action", description: "Mark selected as Completed. Click Save to persist." });
  };

  const applyBulkDropped = () => {
    selectedIds.forEach((id) => {
      setStatusByLearner((prev) => ({ ...prev, [id]: "dropped" }));
      setEnrolled((prev) => ({ ...prev, [id]: false }));
    });
    setSelectedIds(new Set());
    toast({ title: "Bulk action", description: "Mark selected as Dropped. Click Save to persist." });
  };

  const handleSave = () => {
    if (!cls || !term) return;
    let added = 0;
    let updated = 0;
    mockLearners.forEach((learner) => {
      const nowEnrolled = enrolled[learner.id];
      const desiredStatus = statusByLearner[learner.id] ?? "active";
      const existing = enrollmentsForClassAndTerm.find((e) => e.learnerId === learner.id);
      if (nowEnrolled && !existing) {
        addEnrollment({
          classId: cls.id,
          learnerId: learner.id,
          termId: term.id,
          status: "active",
        });
        added++;
      } else if (existing) {
        const targetStatus = nowEnrolled ? desiredStatus : "dropped";
        if (existing.status !== targetStatus) {
          updateEnrollmentStatus(existing.id, targetStatus);
          updated++;
        }
      }
    });
    if (isOverCapacity) {
      toast({
        title: "Over capacity",
        description: "This class is now over capacity. Please review enrolments or adjust capacity.",
        variant: "destructive",
      });
    }
    toast({
      title: "Enrolments saved",
      description: added + updated > 0 ? `Updated ${added + updated} enrolment(s).` : "No changes to save.",
    });
  };

  if (!cls) {
    return (
      <div className="page-container p-6">
        <p className="text-muted-foreground">
          Class not found{classId ? ` for id "${classId}".` : "."} Check the URL or choose a class from the list.
        </p>
        <Link to="/admin/classes" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to classes
        </Link>
      </div>
    );
  }

  if (!term) {
    return (
      <div className="page-container p-6">
        <p className="text-muted-foreground">
          Term not found for this class (termId: {cls.termId}). Check mock data.
        </p>
        <Link to="/admin/classes" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to classes
        </Link>
      </div>
    );
  }

  const capacityLabel =
    cls.capacity != null
      ? `Capacity: ${effectiveActiveCount} / ${cls.capacity} seats filled`
      : null;

  return (
    <div className="page-container">
      <PageBreadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: cls.name },
          { label: "Enrolments" },
        ]}
        className="mb-4"
      />
      <Link
        to="/admin/classes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to classes
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {cls.name}
            {capacityLabel != null && (
              <span className="text-sm font-normal text-muted-foreground">
                {capacityLabel}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {cls.program} · {cls.ageGroup} · {cls.location} · Term: {term.name} · Educator:{" "}
            {getEducatorName(cls.educatorId)}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Enrol learners for this term
                </CardTitle>
                <CardDescription>
                  Enrolled this term: <strong>{enrolledCount}</strong>
                  {effectiveActiveCount !== enrolledCount && (
                    <span className="text-muted-foreground"> ({effectiveActiveCount} active)</span>
                  )}
                  . Check/uncheck and click Save to update.
                </CardDescription>
              </div>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Save changes
              </Button>
            </div>

            {/* Filters + Search */}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search by name or school..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[200px]"
              />
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="School/Organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All schools/orgs</SelectItem>
                  {schoolOrgOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={programTypeFilter} onValueChange={(v) => setProgramTypeFilter(v as "" | LearnerProgramType)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Programme type" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Select
                  value={bulkActionValue}
                  onValueChange={(v) => {
                    if (v === "dropped") {
                      setDropConfirmOpen(true);
                      setBulkActionValue("");
                      return;
                    }
                    if (v === "enroll") applyBulkEnroll();
                    else if (v === "completed") applyBulkCompleted();
                    setBulkActionValue("");
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Bulk actions..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enroll">Enroll selected</SelectItem>
                    <SelectItem value="completed">Mark selected as Completed</SelectItem>
                    <SelectItem value="dropped">Mark selected as Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isOverCapacity && (
              <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This class is now over capacity. Please review enrolments or adjust capacity.
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredLearners.length > 0 && selectedIds.size === filteredLearners.length}
                      onCheckedChange={(c) => selectAllOnPage(!!c)}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead className="w-[80px]">Enrolled</TableHead>
                  <TableHead>Learner</TableHead>
                  <TableHead className="hidden md:table-cell">School/Org</TableHead>
                  <TableHead className="hidden lg:table-cell">Track</TableHead>
                  <TableHead className="hidden lg:table-cell w-[80px]">Attendance</TableHead>
                  <TableHead className="hidden lg:table-cell w-10"></TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLearners.map((learner) => {
                  const isEnrolled = enrolled[learner.id];
                  const status = statusByLearner[learner.id] ?? "active";
                  const isEffectivelyActive = isEnrolled && status === "active";
                  const conflictName =
                    isEffectivelyActive && cls && term
                      ? getConflictOtherClassName(
                          learner.id,
                          cls.id,
                          term.id,
                          enrollments,
                          getClass,
                          getSessionsForClass
                        )
                      : null;
                  const attendancePct =
                    isEnrolled && classSessionIds.length > 0
                      ? getAttendancePctForLearnerInClass(
                          learner.id,
                          classSessionIds,
                          getAttendanceBySession
                        )
                      : null;
                  const atRisk =
                    attendancePct != null && attendancePct < ATTENDANCE_AT_RISK_THRESHOLD;
                  const badgeCount =
                    classSessionIds.length > 0
                      ? getBadgeCountInClassSessions(
                          learner.id,
                          classSessionIds,
                          getBadgesBySession
                        )
                      : 0;
                  const manyBadges = badgeCount >= BADGE_HIGH_COUNT;

                  return (
                    <TableRow key={learner.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(learner.id)}
                          onCheckedChange={() => toggleSelected(learner.id)}
                          aria-label={`Select ${learner.firstName} ${learner.lastName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isEnrolled}
                          onCheckedChange={(checked) => handleToggleEnrolled(learner.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {learner.firstName} {learner.lastName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {getSchoolOrOrgShort(learner)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {getClassTrackLabel(classSessions)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {attendancePct != null ? `${attendancePct}%` : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1">
                          {atRisk && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex text-amber-600 dark:text-amber-400">
                                  <TrendingDown className="h-4 w-4" aria-hidden />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Attendance below {ATTENDANCE_AT_RISK_THRESHOLD}% (at risk)
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {manyBadges && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex text-primary">
                                  <Award className="h-4 w-4" aria-hidden />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {badgeCount} badges in this track
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={status}
                          onValueChange={(v: ClassEnrollmentStatus) =>
                            handleStatusChange(learner.id, v)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {conflictName && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4" aria-hidden />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              This learner is already active in {conflictName} at this time/track.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredLearners.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No learners match the filters.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={dropConfirmOpen} onOpenChange={setDropConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as dropped</AlertDialogTitle>
            <AlertDialogDescription>
              Drop {selectedIds.size} learner{selectedIds.size !== 1 ? "s" : ""} from this class for this term? They
              will be marked as dropped. Click Save below to persist changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyBulkDropped}>Mark as dropped</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

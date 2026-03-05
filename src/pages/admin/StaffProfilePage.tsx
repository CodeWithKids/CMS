import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getStaffMember,
  mockClasses,
  getSessionsForTerm,
  getCurrentTerm,
} from "@/mockData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTerms } from "@/hooks/useTerms";
import { useAuth } from "@/context/AuthContext";
import { isApiEnabled, educatorsGetById, classesGetAll, sessionsGetAll, adminAccountsDelete } from "@/lib/api";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, User, Briefcase, FileText, FolderOpen, BookOpen, Calendar, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ContractType, PayType, PreferredPaymentMethod } from "@/types";

const contractLabels: Record<ContractType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractor: "Contractor",
  volunteer: "Volunteer",
};

const payTypeLabels: Record<PayType, string> = {
  per_session: "Per session",
  salary: "Salary",
  stipend: "Stipend",
};

const paymentMethodLabels: Record<PreferredPaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  eft: "EFT",
  other: "Other",
};

import { formatCurrency } from "@/lib/financeUtils";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const staffId = id ?? "";
  const apiEnabled = isApiEnabled();
  const { currentTerm } = useTerms();
  const termId = currentTerm?.id ?? "t1";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const isOwnProfile = currentUser?.id === staffId;

  const { data: apiStaff } = useQuery({
    queryKey: ["educator", staffId],
    queryFn: () => educatorsGetById(staffId),
    enabled: apiEnabled && !!staffId,
  });
  const { data: apiClasses = [] } = useQuery({
    queryKey: ["classes", "educator", staffId],
    queryFn: () => classesGetAll({ educatorId: staffId }),
    enabled: apiEnabled && !!staffId,
  });
  const { data: apiSessions = [] } = useQuery({
    queryKey: ["sessions", "educator", staffId, termId],
    queryFn: () => sessionsGetAll({ educatorId: staffId, termId, dateFrom: currentTerm?.startDate, dateTo: currentTerm?.endDate }),
    enabled: apiEnabled && !!staffId && !!termId,
  });

  const staff = apiEnabled && apiStaff
    ? {
        id: apiStaff.id,
        name: apiStaff.name,
        email: apiStaff.email ?? "",
        role: apiStaff.role,
        employmentStatus: (apiStaff.status ?? "active").replace("_", " "),
        contractType: undefined as ContractType | undefined,
        phone: undefined as string | undefined,
        hireDate: undefined as string | undefined,
        createdAt: apiStaff.createdAt,
        notes: undefined as string | undefined,
      }
    : getStaffMember(staffId);
  const assignedClasses = apiEnabled ? apiClasses : (staff ? mockClasses.filter((c) => c.educatorId === staffId) : []);
  const sessionsThisTerm = apiEnabled
    ? apiSessions
    : staff
      ? getSessionsForTerm(termId).filter(
          (s) =>
            s.leadEducatorId === staffId ||
            (s.assistantEducatorIds ?? []).includes(staffId)
        )
      : [];
  const hoursThisTerm = sessionsThisTerm.reduce((sum, s) => sum + (s.durationHours ?? 1), 0);
  const facilitatingHours = sessionsThisTerm
    .filter((s) => s.leadEducatorId === staffId)
    .reduce((sum, s) => sum + (s.durationHours ?? 1), 0);
  const coachingHours = sessionsThisTerm
    .filter((s) => (s.assistantEducatorIds ?? []).includes(staffId))
    .reduce((sum, s) => sum + (s.durationHours ?? 1), 0);

  if (!staff) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Staff member not found.</p>
        <Link to="/admin/hr/staff" className="text-primary hover:underline text-sm">
          ← Back to staff directory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Staff", href: "/admin/hr/staff" },
          { label: staff.name },
        ]}
        className="mb-4"
      />
      <Link
        to="/admin/hr/staff"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to staff directory
      </Link>

      {/* Personal & status */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{staff.name}</CardTitle>
                <CardDescription className="capitalize mt-0.5">
                  {staff.role}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{(staff as { employmentStatus?: string }).employmentStatus ?? "active"}</Badge>
                  {(staff as { contractType?: ContractType }).contractType && (
                    <Badge variant="outline">{contractLabels[(staff as { contractType: ContractType }).contractType]}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{staff.email}</p>
            </div>
            {staff.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm">{staff.phone}</p>
              </div>
            )}
            {staff.hireDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hire date</p>
                <p className="text-sm">{formatDate(staff.hireDate)}</p>
              </div>
            )}
            {staff.createdAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Record created</p>
                <p className="text-sm">{formatDate(staff.createdAt)}</p>
              </div>
            )}
          </div>
          {staff.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{staff.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned classes & sessions (educators) */}
      {staff.role === "educator" && (assignedClasses.length > 0 || sessionsThisTerm.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Workload this term
            </CardTitle>
            <CardDescription>
              {currentTerm?.name ?? "Current term"} — assigned classes, sessions, and hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedClasses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Assigned classes</p>
                <ul className="space-y-1">
                  {assignedClasses.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/admin/classes/${c.id}/enrolments`}
                        className="text-primary hover:underline text-sm"
                      >
                        {c.name}
                      </Link>
                      <span className="text-muted-foreground text-sm ml-2">
                        {c.program} · {c.ageGroup}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Sessions this term
                </p>
                <p className="text-xl font-semibold">{sessionsThisTerm.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Hours summary
                </p>
                <p className="text-xl font-semibold">{hoursThisTerm.toFixed(1)} h</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {facilitatingHours.toFixed(1)} h facilitating · {coachingHours.toFixed(1)} h coaching
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employment & pay */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Employment details
          </CardTitle>
          <CardDescription>Pay type, rate, and payment method.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {staff.payType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pay type</p>
                <p className="text-sm">{payTypeLabels[staff.payType]}</p>
              </div>
            )}
            {staff.baseRate != null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Base rate</p>
                <p className="text-sm">{formatCurrency(staff.baseRate)}</p>
              </div>
            )}
            {staff.preferredPaymentMethod && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preferred payment</p>
                <p className="text-sm">{paymentMethodLabels[staff.preferredPaymentMethod]}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {staff.skills && staff.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {staff.skills.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents / certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" /> Documents & certifications
          </CardTitle>
          <CardDescription>
            Upload and manage documents (upload coming later).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.documents && staff.documents.length > 0 ? (
            <ul className="space-y-2">
              {staff.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {doc.type}
                    {doc.uploadedAt && ` · ${formatDate(doc.uploadedAt)}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No documents on file.</p>
          )}
        </CardContent>
      </Card>

      {/* Delete account (admin only, not own profile) */}
      {isAdmin && apiEnabled && !isOwnProfile && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete this account. They will no longer be able to log in. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete the account for <strong>{staff.name}</strong>? They will no longer be able to log in.
            This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!apiEnabled) return;
                setDeleteLoading(true);
                try {
                  await adminAccountsDelete(staffId);
                  queryClient.invalidateQueries({ queryKey: ["educators"] });
                  toast({ title: "Account deleted", description: `${staff.name} has been removed.` });
                  navigate("/admin/hr/staff");
                } catch (err: unknown) {
                  const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
                  toast({ title: "Delete failed", description: msg ?? "Could not delete account.", variant: "destructive" });
                } finally {
                  setDeleteLoading(false);
                }
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

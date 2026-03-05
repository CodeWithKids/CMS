import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLearners } from "@/hooks/useLearners";
import { useOrganisation } from "@/hooks/useOrganisation";
import { useAuth } from "@/context/AuthContext";
import {
  isApiEnabled,
  learnersCreate,
  learnersPatch,
  learnersDelete,
  partnersGetParents,
  partnersGetOrganisations,
  type LearnerApi,
  type ParentPartnerApi,
} from "@/lib/api";
import { Search, AlertCircle, WifiOff, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import type { LearnerEnrolmentType } from "@/types";

const PROGRAM_TYPES = [
  { value: "MAKERSPACE", label: "Makerspace" },
  { value: "SCHOOL_CLUB", label: "School club" },
  { value: "ORGANISATION", label: "Organisation" },
] as const;

type LearnerFormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  school: string;
  enrolmentType: LearnerEnrolmentType;
  programType: string;
  membershipStatus: string;
  userId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  organizationId: string;
  status: string;
  gender: string;
  joinedAt: string;
};

const emptyForm: LearnerFormState = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  school: "",
  enrolmentType: "member",
  programType: "MAKERSPACE",
  membershipStatus: "",
  userId: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  organizationId: "",
  status: "active",
  gender: "",
  joinedAt: "",
};

function learnerToForm(l: LearnerApi): LearnerFormState {
  return {
    firstName: l.firstName,
    lastName: l.lastName,
    dateOfBirth: l.dateOfBirth,
    school: l.school,
    enrolmentType: l.enrolmentType as LearnerEnrolmentType,
    programType: l.programType,
    membershipStatus: l.membershipStatus ?? "",
    userId: l.userId ?? "",
    parentName: l.parentName ?? "",
    parentPhone: l.parentPhone ?? "",
    parentEmail: l.parentEmail ?? "",
    organizationId: l.organizationId ?? "",
    status: l.status,
    gender: l.gender ?? "",
    joinedAt: l.joinedAt ?? "",
  };
}

function OrgContactCell({ orgId }: { orgId: string }) {
  const { organisation } = useOrganisation(orgId);
  return <span className="text-sm text-muted-foreground">{organisation?.name ?? "—"}</span>;
}

export default function LearnersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [enrolmentFilter, setEnrolmentFilter] = useState<LearnerEnrolmentType | "all">("all");
  const [isError, setIsError] = useState(false);
  const [formOpen, setFormOpen] = useState<"create" | LearnerApi | null>(null);
  const [formState, setFormState] = useState<LearnerFormState>(emptyForm);
  const [formSaving, setFormSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LearnerApi | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const apiEnabled = isApiEnabled();
  const isAdmin = currentUser?.role === "admin";

  const { learners, isLoading } = useLearners({
    enrolmentType: enrolmentFilter === "all" ? undefined : enrolmentFilter,
    search: search.trim() || undefined,
  });

  const { data: parents = [] } = useQuery({
    queryKey: ["partners", "parents"],
    queryFn: () => partnersGetParents(),
    enabled: apiEnabled && isAdmin && (formOpen === "create" || formOpen !== null),
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ["partners", "organisations"],
    queryFn: () => partnersGetOrganisations(),
    enabled: apiEnabled && isAdmin && (formOpen === "create" || formOpen !== null),
  });

  const showApiSetup = !apiEnabled;
  const filtered = apiEnabled ? learners : [];

  function openCreate() {
    setFormState(emptyForm);
    setFormOpen("create");
  }

  function openEdit(l: LearnerApi) {
    setFormState(learnerToForm(l));
    setFormOpen(l);
  }

  function handleParentSelect(parent: ParentPartnerApi | null) {
    if (!parent) {
      setFormState((s) => ({ ...s, userId: "", parentName: "", parentEmail: "" }));
      return;
    }
    setFormState((s) => ({
      ...s,
      userId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email ?? "",
    }));
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const { firstName, lastName, dateOfBirth, school, enrolmentType, programType, status } = formState;
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth.trim() || !school.trim() || !enrolmentType || !programType) {
      toast({ title: "Missing fields", description: "First name, last name, date of birth, school, enrolment type, and program type are required.", variant: "destructive" });
      return;
    }

    setFormSaving(true);
    const payload = {
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      dateOfBirth: formState.dateOfBirth.trim(),
      school: formState.school.trim(),
      enrolmentType: formState.enrolmentType,
      programType: formState.programType,
      membershipStatus: formState.membershipStatus.trim() || undefined,
      userId: formState.userId.trim() || undefined,
      parentName: formState.parentName.trim() || undefined,
      parentPhone: formState.parentPhone.trim() || undefined,
      parentEmail: formState.parentEmail.trim() || undefined,
      organizationId: formState.organizationId.trim() || undefined,
      status: formState.status || "active",
      gender: formState.gender.trim() || undefined,
      joinedAt: formState.joinedAt.trim() || undefined,
    };

    if (formOpen === "create") {
      learnersCreate(payload)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["learners"] });
          toast({ title: "Learner created" });
          setFormOpen(null);
        })
        .catch((err: unknown) => {
          const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
          toast({ title: "Create failed", description: msg ?? "Could not create learner.", variant: "destructive" });
        })
        .finally(() => setFormSaving(false));
    } else if (typeof formOpen === "object" && formOpen.id) {
      learnersPatch(formOpen.id, payload)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["learners"] });
          toast({ title: "Learner updated" });
          setFormOpen(null);
        })
        .catch((err: unknown) => {
          const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
          toast({ title: "Update failed", description: msg ?? "Could not update learner.", variant: "destructive" });
        })
        .finally(() => setFormSaving(false));
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget || !apiEnabled) return;
    setDeleteLoading(true);
    learnersDelete(deleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["learners"] });
        toast({ title: "Learner deleted", description: `${deleteTarget.firstName} ${deleteTarget.lastName} has been removed.` });
        setDeleteTarget(null);
      })
      .catch((err: unknown) => {
        const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
        toast({ title: "Delete failed", description: msg ?? "Could not delete learner.", variant: "destructive" });
      })
      .finally(() => setDeleteLoading(false));
  }

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="page-title">Learners</h1>
          <p className="page-subtitle">Manage all registered learners (members and partner-org)</p>
        </div>
        {apiEnabled && isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add learner
          </Button>
        )}
      </div>

      {showApiSetup && (
        <Alert className="mb-4 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Using demo data</AlertTitle>
          <AlertDescription>
            Learner data comes from the API. To load real learners from the database, add{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_API_URL=http://localhost:3001</code> to a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> file in the project root (same folder as{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">package.json</code>), then restart the frontend dev server and ensure the API is running from <code className="rounded bg-muted px-1 py-0.5 text-xs">server/</code>.
          </AlertDescription>
        </Alert>
      )}

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
      {isLoading && (
        <p className="text-sm text-muted-foreground mb-4">Loading learners…</p>
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

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>School</th>
              <th>Enrolment</th>
              <th>Contact (parent / org)</th>
              <th>Status</th>
              <th></th>
              {apiEnabled && isAdmin && <th className="w-[100px]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const contact =
                l.enrolmentType === "member"
                  ? `${l.parentName ?? "—"} · ${l.parentPhone ?? "—"} · ${l.parentEmail ?? "—"}`
                  : l.organizationId
                    ? null
                    : "—";
              return (
                <tr key={l.id}>
                  <td className="font-medium">{l.firstName} {l.lastName}</td>
                  <td>{l.school}</td>
                  <td>
                    <Badge variant="outline">{l.enrolmentType === "member" ? "Member" : "Partner org"}</Badge>
                  </td>
                  <td className="text-sm text-muted-foreground max-w-[220px] truncate" title={typeof contact === "string" ? contact : undefined}>
                    {contact !== null ? contact : l.organizationId ? <OrgContactCell orgId={l.organizationId} /> : "—"}
                  </td>
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
                  {apiEnabled && isAdmin && (
                    <td className="space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)} title="Edit learner">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(l)}
                        title="Delete learner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-6">
          {showApiSetup
            ? "Configure the API (see message above) to load learners."
            : search.trim() || enrolmentFilter !== "all"
              ? "No learners match your filters. Try changing the search or enrolment type."
              : "No learners in the system yet."}
        </p>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen !== null} onOpenChange={(open) => !open && setFormOpen(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formOpen === "create" ? "Add learner" : "Edit learner"}</DialogTitle>
            <DialogDescription>
              {formOpen === "create"
                ? "Create a new learner. Assign to a parent account to link them."
                : "Update learner details or assign to a different parent."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="learner-firstName">First name</Label>
                <Input
                  id="learner-firstName"
                  value={formState.firstName}
                  onChange={(e) => setFormState((s) => ({ ...s, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="learner-lastName">Last name</Label>
                <Input
                  id="learner-lastName"
                  value={formState.lastName}
                  onChange={(e) => setFormState((s) => ({ ...s, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="learner-dob">Date of birth</Label>
              <Input
                id="learner-dob"
                type="date"
                value={formState.dateOfBirth}
                onChange={(e) => setFormState((s) => ({ ...s, dateOfBirth: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="learner-school">School</Label>
              <Input
                id="learner-school"
                value={formState.school}
                onChange={(e) => setFormState((s) => ({ ...s, school: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Enrolment type</Label>
                <Select
                  value={formState.enrolmentType}
                  onValueChange={(v) => setFormState((s) => ({ ...s, enrolmentType: v as LearnerEnrolmentType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="partner_org">Partner org</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program type</Label>
                <Select
                  value={formState.programType}
                  onValueChange={(v) => setFormState((s) => ({ ...s, programType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign to parent account</Label>
              <Select
                value={formState.userId || "none"}
                onValueChange={(v) => {
                  const parent = v === "none" ? null : parents.find((p) => p.id === v) ?? null;
                  handleParentSelect(parent);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {parents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.email ? `(${p.email})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Link this learner to a parent so they can see the learner in their account.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="learner-parentName">Parent name</Label>
                <Input
                  id="learner-parentName"
                  value={formState.parentName}
                  onChange={(e) => setFormState((s) => ({ ...s, parentName: e.target.value }))}
                  placeholder="Override if different"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="learner-parentEmail">Parent email</Label>
                <Input
                  id="learner-parentEmail"
                  type="email"
                  value={formState.parentEmail}
                  onChange={(e) => setFormState((s) => ({ ...s, parentEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="learner-parentPhone">Parent phone</Label>
              <Input
                id="learner-parentPhone"
                value={formState.parentPhone}
                onChange={(e) => setFormState((s) => ({ ...s, parentPhone: e.target.value }))}
              />
            </div>

            {formState.enrolmentType === "partner_org" && (
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Select
                  value={formState.organizationId || "none"}
                  onValueChange={(v) => setFormState((s) => ({ ...s, organizationId: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {organisations.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formState.status} onValueChange={(v) => setFormState((s) => ({ ...s, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="learner-joinedAt">Joined at</Label>
                <Input
                  id="learner-joinedAt"
                  type="date"
                  value={formState.joinedAt}
                  onChange={(e) => setFormState((s) => ({ ...s, joinedAt: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={formSaving}>{formSaving ? "Saving…" : formOpen === "create" ? "Add learner" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete learner</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Permanently delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>? This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
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

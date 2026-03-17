import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mockClasses, getEducatorName, getTerm, PROGRAM_NAMES } from "@/mockData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertCircle, BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTerms } from "@/hooks/useTerms";
import { useEducators } from "@/hooks/useEducators";
import {
  isApiEnabled,
  classesGetAll,
  classesCreate,
  classesPatch,
  classesDelete,
  focusAreasGetAll,
  type ClassApi,
} from "@/lib/api";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";

const AGE_GROUP_OPTIONS = ["6-8", "8-10", "8-13", "10-14", "13-18"];

/** School/organisation names the class can belong to. Add more as needed. */
export const SCHOOL_OR_ORGANISATION_OPTIONS = [
  "Code With Kids - Makerspace",
  "Code With Kids - Virtual",
  "Code With Kids - Home Sessions",
  "Light International School",
  "Kokomelon Schools",
  "Kianda School",
  "Vine Garden Academy",
  "KE 916 Kibera",
  "KE 370 Waithaka",
  "KE 462 Limuru",
  "KE Kangemi Church CDC",
  "Spur Afrika",
  "Smart Kibera of Hope(SKOH)",
  "Maisha Trust",
  "Daraja Tech Program",
] as const;

const ALL_TRACK_IDS: LearningTrack[] = [
  "computer_basics", "game_design", "web_design", "app_design", "python", "graphic_design",
  "robotics", "3d_design", "microbit", "physical_computing", "science_experiments",
  "financial_literacy", "ai", "blockchain", "esports",
];

type ClassFormState = {
  name: string;
  program: string;
  ageGroup: string;
  location: string;
  schoolOrOrganisationName: string;
  educatorId: string;
  termId: string;
  capacity: string;
  trackId: string;
};

const emptyForm: ClassFormState = {
  name: "",
  program: "",
  ageGroup: "8-13",
  location: "",
  schoolOrOrganisationName: "",
  educatorId: "",
  termId: "",
  capacity: "",
  trackId: "",
};

function classToForm(c: ClassApi): ClassFormState {
  return {
    name: c.name,
    program: c.program,
    ageGroup: c.ageGroup,
    location: c.location,
    schoolOrOrganisationName: c.schoolOrOrganisationName ?? "",
    educatorId: c.educatorId,
    termId: c.termId,
    capacity: c.capacity != null ? String(c.capacity) : "",
    trackId: c.trackId ?? "",
  };
}

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { terms } = useTerms();
  const { educators } = useEducators();
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [selectedFocusAreaId, setSelectedFocusAreaId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<"create" | ClassApi | null>(null);
  const [formState, setFormState] = useState<ClassFormState>(emptyForm);
  const [formSaving, setFormSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassApi | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const apiEnabled = isApiEnabled();
  const isAdmin = currentUser?.role === "admin";

  const { data: focusAreas = [] } = useQuery({
    queryKey: ["focus-areas"],
    queryFn: focusAreasGetAll,
    enabled: apiEnabled,
    staleTime: 10 * 60 * 1000,
  });

  const { data: apiClasses = [], isLoading, isError } = useQuery({
    queryKey: ["classes", selectedTrackId ?? ""],
    queryFn: () => classesGetAll(selectedTrackId ? { trackId: selectedTrackId } : {}),
    enabled: apiEnabled,
  });

  const classes = apiEnabled ? apiClasses : mockClasses;
  const tracksForFilter = useMemo(() => {
    if (selectedFocusAreaId) {
      const fa = focusAreas.find((f) => f.id === selectedFocusAreaId);
      return fa?.tracks ?? [];
    }
    return focusAreas.flatMap((fa) => fa.tracks);
  }, [focusAreas, selectedFocusAreaId]);
  const educatorOptions = useMemo(
    () => educators.filter((e) => e.role === "educator"),
    [educators]
  );
  const educatorNameMap = useMemo(
    () => Object.fromEntries(educators.map((e) => [e.id, e.name])),
    [educators]
  );
  const termNameMap = useMemo(
    () => Object.fromEntries(terms.map((t) => [t.id, t.name])),
    [terms]
  );

  const filteredClasses = useMemo(() => {
    let list = classes;
    if (selectedPrograms.size > 0) list = list.filter((c) => selectedPrograms.has(c.program));
    if (selectedTrackId) list = list.filter((c) => c.trackId === selectedTrackId);
    return list;
  }, [classes, selectedPrograms, selectedTrackId]);

  function toggleProgram(program: string) {
    setSelectedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(program)) next.delete(program);
      else next.add(program);
      return next;
    });
  }

  function openCreate() {
    setFormState(emptyForm);
    setFormOpen("create");
  }

  function openEdit(c: ClassApi) {
    setFormState(classToForm(c));
    setFormOpen(c);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const educatorId = formState.educatorId.trim();
    const termId = formState.termId.trim();
    if (!formState.name.trim() || !formState.program || !formState.ageGroup || !formState.location || !educatorId || !termId) {
      toast({ title: "Missing fields", description: "Fill in all required fields.", variant: "destructive" });
      return;
    }
    const capacity = formState.capacity.trim() ? parseInt(formState.capacity, 10) : null;
    if (formState.capacity.trim() && (Number.isNaN(capacity) || capacity! < 0)) {
      toast({ title: "Invalid capacity", description: "Capacity must be a positive number.", variant: "destructive" });
      return;
    }

    setFormSaving(true);
    const payload = {
      name: formState.name.trim(),
      program: formState.program,
      ageGroup: formState.ageGroup,
      location: formState.location.trim(),
      educatorId,
      termId,
      capacity: capacity ?? undefined,
      schoolOrOrganisationName: formState.schoolOrOrganisationName.trim() || undefined,
      trackId: formState.trackId.trim() || undefined,
    };

    if (formOpen === "create") {
      classesCreate(payload)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["classes"] });
          toast({ title: "Class created" });
          setFormOpen(null);
        })
        .catch((err: unknown) => {
          const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
          toast({ title: "Create failed", description: msg ?? "Could not create class.", variant: "destructive" });
        })
        .finally(() => setFormSaving(false));
    } else if (typeof formOpen === "object" && formOpen.id) {
      classesPatch(formOpen.id, payload)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["classes"] });
          toast({ title: "Class updated" });
          setFormOpen(null);
        })
        .catch((err: unknown) => {
          const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
          toast({ title: "Update failed", description: msg ?? "Could not update class.", variant: "destructive" });
        })
        .finally(() => setFormSaving(false));
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget || !apiEnabled) return;
    setDeleteLoading(true);
    classesDelete(deleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["classes"] });
        toast({ title: "Class deleted", description: `${deleteTarget.name} has been removed.` });
        setDeleteTarget(null);
      })
      .catch((err: unknown) => {
        const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
        toast({ title: "Delete failed", description: msg ?? "Could not delete class.", variant: "destructive" });
      })
      .finally(() => setDeleteLoading(false));
  }

  const getEducatorDisplay = (educatorId: string) =>
    educatorNameMap[educatorId] ?? getEducatorName(educatorId);
  const getTermDisplay = (termId: string) => termNameMap[termId] ?? getTerm(termId)?.name ?? termId;

  if (apiEnabled && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-5 w-80 mb-6" />
        <Skeleton className="h-10 w-full max-w-md mb-4" />
        <div className="rounded-lg border overflow-hidden">
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">All active classes and programs</p>
        </div>
        {apiEnabled && isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Create class
          </Button>
        )}
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Filter by type of class</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {PROGRAM_NAMES.map((program) => (
            <label
              key={program}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                checked={selectedPrograms.has(program)}
                onCheckedChange={() => toggleProgram(program)}
              />
              <span>{program}</span>
            </label>
          ))}
        </div>
        {apiEnabled && focusAreas.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
            <span className="text-sm font-medium text-muted-foreground">Focus area → Track:</span>
            <Select
              value={selectedFocusAreaId ?? "all"}
              onValueChange={(v) => {
                setSelectedFocusAreaId(v === "all" ? null : v);
                setSelectedTrackId(null);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All focus areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All focus areas</SelectItem>
                {focusAreas.map((fa) => (
                  <SelectItem key={fa.id} value={fa.id}>{fa.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTrackId ?? "all"}
              onValueChange={(v) => setSelectedTrackId(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All tracks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tracks</SelectItem>
                {tracksForFilter.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(selectedFocusAreaId !== null || selectedTrackId !== null) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setSelectedFocusAreaId(null); setSelectedTrackId(null); }}
              >
                Clear focus/track
              </Button>
            )}
          </div>
        )}
        {selectedPrograms.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-muted-foreground"
            onClick={() => setSelectedPrograms(new Set())}
          >
            Clear program filter
          </Button>
        )}
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load classes.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => queryClient.invalidateQueries({ queryKey: ["classes"] })}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm mt-1">Add your first class to get started.</p>
          {apiEnabled && isAdmin && (
            <Button onClick={openCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create class
            </Button>
          )}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No classes match the selected types</p>
          <p className="text-sm mt-1">Select one or more programs above, or clear the filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>School / Organisation</th>
                <th>Type of class</th>
                <th>Track</th>
                <th>Age Group</th>
                <th>Location</th>
                <th>Educator</th>
                <th>Term</th>
                <th className="w-[140px]">Actions</th>
                {apiEnabled && isAdmin && <th className="w-[100px]"></th>}
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.schoolOrOrganisationName ?? "—"}</td>
                  <td>{c.program}</td>
                  <td className="text-muted-foreground text-sm">{c.trackId ? (LEARNING_TRACK_LABELS[c.trackId as LearningTrack] ?? c.trackId) : "—"}</td>
                  <td>{c.ageGroup}</td>
                  <td>{c.location}</td>
                  <td>{getEducatorDisplay(c.educatorId)}</td>
                  <td>{getTermDisplay(c.termId)}</td>
                  <td>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/classes/${c.id}/enrolments`}>Manage enrolments</Link>
                    </Button>
                  </td>
                  {apiEnabled && isAdmin && (
                    <td className="space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        title="Edit class"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(c)}
                        title="Delete class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen !== null} onOpenChange={(open) => !open && setFormOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{formOpen === "create" ? "Create class" : "Edit class"}</DialogTitle>
            <DialogDescription>
              {formOpen === "create"
                ? "Add a new class. Assign an educator and term."
                : "Update class details."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class name</Label>
              <Input
                id="class-name"
                value={formState.name}
                onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Code With Kids - Makerspace"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-program">Type of class</Label>
              <Select
                value={formState.program || undefined}
                onValueChange={(v) => setFormState((s) => ({ ...s, program: v }))}
                required
              >
                <SelectTrigger id="class-program">
                  <SelectValue placeholder="Select type of class" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_NAMES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-age">Age group</Label>
              <Select
                value={formState.ageGroup || undefined}
                onValueChange={(v) => setFormState((s) => ({ ...s, ageGroup: v }))}
              >
                <SelectTrigger id="class-age">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUP_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-location">Location</Label>
              <Input
                id="class-location"
                value={formState.location}
                onChange={(e) => setFormState((s) => ({ ...s, location: e.target.value }))}
                placeholder="e.g. Makerspace"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-school-org">School / Organisation</Label>
              <Select
                value={formState.schoolOrOrganisationName || "none"}
                onValueChange={(v) => setFormState((s) => ({ ...s, schoolOrOrganisationName: v === "none" ? "" : v }))}
              >
                <SelectTrigger id="class-school-org">
                  <SelectValue placeholder="Select school or organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {SCHOOL_OR_ORGANISATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-educator">Educator</Label>
              <Select
                value={formState.educatorId || undefined}
                onValueChange={(v) => setFormState((s) => ({ ...s, educatorId: v }))}
                required
              >
                <SelectTrigger id="class-educator">
                  <SelectValue placeholder="Select educator" />
                </SelectTrigger>
                <SelectContent>
                  {educatorOptions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-term">Term</Label>
              <Select
                value={formState.termId || undefined}
                onValueChange={(v) => setFormState((s) => ({ ...s, termId: v }))}
                required
              >
                <SelectTrigger id="class-term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-track">Learning track (optional)</Label>
              <Select
                value={formState.trackId || "none"}
                onValueChange={(v) => setFormState((s) => ({ ...s, trackId: v === "none" ? "" : v }))}
              >
                <SelectTrigger id="class-track">
                  <SelectValue placeholder="Select track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {apiEnabled && focusAreas.length > 0
                    ? focusAreas.flatMap((fa) =>
                        fa.tracks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))
                      )
                    : ALL_TRACK_IDS.map((id) => (
                        <SelectItem key={id} value={id}>{LEARNING_TRACK_LABELS[id]}</SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-capacity">Capacity (optional)</Label>
              <Input
                id="class-capacity"
                type="number"
                min={1}
                value={formState.capacity}
                onChange={(e) => setFormState((s) => ({ ...s, capacity: e.target.value }))}
                placeholder="e.g. 30"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSaving}>
                {formSaving ? "Saving…" : formOpen === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Permanently delete <strong>{deleteTarget.name}</strong>? Any sessions and related data for this class will also be removed. This cannot be undone.
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

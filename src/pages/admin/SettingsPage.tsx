import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  mockPrograms,
  mockTerms,
  mockLocations,
  mockAgeGroups,
  mockIncomeSources,
  mockExpenseCategories,
} from "@/mockData";
import { BookOpen, Calendar, MapPin, Users, TrendingUp, TrendingDown, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTerms } from "@/hooks/useTerms";
import {
  isApiEnabled,
  termsCreate,
  termsPatch,
  termsDelete,
  type TermApi,
  programsGetAll,
  programsCreate,
  programsPatch,
  programsDelete,
  type ProgramApi,
  locationsGetAll,
  locationsCreate,
  locationsPatch,
  locationsDelete,
  type LocationApi,
  ageGroupsGetAll,
  ageGroupsCreate,
  ageGroupsPatch,
  ageGroupsDelete,
  type AgeGroupApi,
  incomeSourcesGetAll,
  incomeSourcesCreate,
  incomeSourcesPatch,
  incomeSourcesDelete,
  type IncomeSourceApi,
  expenseCategoriesGetAll,
  expenseCategoriesCreate,
  expenseCategoriesPatch,
  expenseCategoriesDelete,
  type ExpenseCategoryApi,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function toastError(toast: ReturnType<typeof useToast>["toast"], title: string, err: unknown, fallback: string) {
  const msg = err && typeof err === "object" && "body" in err && (err as { body?: { message?: string } }).body?.message;
  toast({ title, description: msg ?? fallback, variant: "destructive" });
}

// ——— Term form ———
type TermFormState = { name: string; startDate: string; endDate: string; isCurrent: boolean };
const emptyTermForm: TermFormState = { name: "", startDate: "", endDate: "", isCurrent: false };

// ——— Program form ———
type ProgramFormState = { name: string; description: string };
const emptyProgramForm: ProgramFormState = { name: "", description: "" };

// ——— Location form ———
type LocationFormState = { name: string; address: string };
const emptyLocationForm: LocationFormState = { name: "", address: "" };

// ——— Age group form ———
type AgeGroupFormState = { name: string; minAge: string; maxAge: string };
const emptyAgeGroupForm: AgeGroupFormState = { name: "", minAge: "", maxAge: "" };

// ——— Income source form ———
type IncomeSourceFormState = { name: string; code: string };
const emptyIncomeSourceForm: IncomeSourceFormState = { name: "", code: "" };

// ——— Expense category form ———
type ExpenseCategoryFormState = { name: string; code: string };
const emptyExpenseCategoryForm: ExpenseCategoryFormState = { name: "", code: "" };

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { terms, currentTerm, isLoading: termsLoading } = useTerms();
  const apiEnabled = isApiEnabled();
  const isAdmin = currentUser?.role === "admin";

  // Terms state
  const [termFormOpen, setTermFormOpen] = useState<"create" | TermApi | null>(null);
  const [termFormState, setTermFormState] = useState<TermFormState>(emptyTermForm);
  const [termFormSaving, setTermFormSaving] = useState(false);
  const [termDeleteTarget, setTermDeleteTarget] = useState<TermApi | null>(null);
  const [termDeleteLoading, setTermDeleteLoading] = useState(false);

  // Programs
  const { data: programsList = [], isLoading: programsLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: programsGetAll,
    enabled: apiEnabled,
  });
  const [programFormOpen, setProgramFormOpen] = useState<"create" | ProgramApi | null>(null);
  const [programFormState, setProgramFormState] = useState<ProgramFormState>(emptyProgramForm);
  const [programFormSaving, setProgramFormSaving] = useState(false);
  const [programDeleteTarget, setProgramDeleteTarget] = useState<ProgramApi | null>(null);
  const [programDeleteLoading, setProgramDeleteLoading] = useState(false);

  // Locations
  const { data: locationsList = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: locationsGetAll,
    enabled: apiEnabled,
  });
  const [locationFormOpen, setLocationFormOpen] = useState<"create" | LocationApi | null>(null);
  const [locationFormState, setLocationFormState] = useState<LocationFormState>(emptyLocationForm);
  const [locationFormSaving, setLocationFormSaving] = useState(false);
  const [locationDeleteTarget, setLocationDeleteTarget] = useState<LocationApi | null>(null);
  const [locationDeleteLoading, setLocationDeleteLoading] = useState(false);

  // Age groups
  const { data: ageGroupsList = [], isLoading: ageGroupsLoading } = useQuery({
    queryKey: ["ageGroups"],
    queryFn: ageGroupsGetAll,
    enabled: apiEnabled,
  });
  const [ageGroupFormOpen, setAgeGroupFormOpen] = useState<"create" | AgeGroupApi | null>(null);
  const [ageGroupFormState, setAgeGroupFormState] = useState<AgeGroupFormState>(emptyAgeGroupForm);
  const [ageGroupFormSaving, setAgeGroupFormSaving] = useState(false);
  const [ageGroupDeleteTarget, setAgeGroupDeleteTarget] = useState<AgeGroupApi | null>(null);
  const [ageGroupDeleteLoading, setAgeGroupDeleteLoading] = useState(false);

  // Income sources
  const { data: incomeSourcesList = [], isLoading: incomeSourcesLoading } = useQuery({
    queryKey: ["incomeSources"],
    queryFn: incomeSourcesGetAll,
    enabled: apiEnabled,
  });
  const [incomeSourceFormOpen, setIncomeSourceFormOpen] = useState<"create" | IncomeSourceApi | null>(null);
  const [incomeSourceFormState, setIncomeSourceFormState] = useState<IncomeSourceFormState>(emptyIncomeSourceForm);
  const [incomeSourceFormSaving, setIncomeSourceFormSaving] = useState(false);
  const [incomeSourceDeleteTarget, setIncomeSourceDeleteTarget] = useState<IncomeSourceApi | null>(null);
  const [incomeSourceDeleteLoading, setIncomeSourceDeleteLoading] = useState(false);

  // Expense categories
  const { data: expenseCategoriesList = [], isLoading: expenseCategoriesLoading } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: expenseCategoriesGetAll,
    enabled: apiEnabled,
  });
  const [expenseCategoryFormOpen, setExpenseCategoryFormOpen] = useState<"create" | ExpenseCategoryApi | null>(null);
  const [expenseCategoryFormState, setExpenseCategoryFormState] = useState<ExpenseCategoryFormState>(emptyExpenseCategoryForm);
  const [expenseCategoryFormSaving, setExpenseCategoryFormSaving] = useState(false);
  const [expenseCategoryDeleteTarget, setExpenseCategoryDeleteTarget] = useState<ExpenseCategoryApi | null>(null);
  const [expenseCategoryDeleteLoading, setExpenseCategoryDeleteLoading] = useState(false);

  const termsList = apiEnabled ? (terms ?? []).map((t) => ({ id: t.id, name: t.name, startDate: t.startDate, endDate: t.endDate })) : mockTerms;
  const programsDisplay = apiEnabled ? programsList : mockPrograms;
  const locationsDisplay = apiEnabled ? locationsList : mockLocations;
  const ageGroupsDisplay = apiEnabled ? ageGroupsList : mockAgeGroups;
  const incomeSourcesDisplay = apiEnabled ? incomeSourcesList : mockIncomeSources;
  const expenseCategoriesDisplay = apiEnabled ? expenseCategoriesList : mockExpenseCategories;

  // ——— Term handlers ———
  function openTermCreate() {
    setTermFormState(emptyTermForm);
    setTermFormOpen("create");
  }
  function openTermEdit(t: TermApi | { id: string; name: string; startDate: string; endDate: string }) {
    setTermFormState({ name: t.name, startDate: t.startDate, endDate: t.endDate, isCurrent: currentTerm?.id === t.id });
    setTermFormOpen(t as TermApi);
  }
  function handleTermFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const { name, startDate, endDate, isCurrent } = termFormState;
    if (!name.trim() || !startDate || !endDate) {
      toast({ title: "Missing fields", description: "Name, start date, and end date are required.", variant: "destructive" });
      return;
    }
    setTermFormSaving(true);
    if (termFormOpen === "create") {
      termsCreate({ name: name.trim(), startDate, endDate, isCurrent })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["terms"] });
          queryClient.invalidateQueries({ queryKey: ["terms", "current"] });
          toast({ title: "Term created" });
          setTermFormOpen(null);
        })
        .catch((err) => toastError(toast, "Create failed", err, "Could not create term."))
        .finally(() => setTermFormSaving(false));
    } else if (typeof termFormOpen === "object" && termFormOpen.id) {
      termsPatch(termFormOpen.id, { name: name.trim(), startDate, endDate, isCurrent })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["terms"] });
          queryClient.invalidateQueries({ queryKey: ["terms", "current"] });
          toast({ title: "Term updated" });
          setTermFormOpen(null);
        })
        .catch((err) => toastError(toast, "Update failed", err, "Could not update term."))
        .finally(() => setTermFormSaving(false));
    }
  }
  function handleTermDelete() {
    if (!termDeleteTarget || !apiEnabled) return;
    setTermDeleteLoading(true);
    termsDelete(termDeleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["terms"] });
        queryClient.invalidateQueries({ queryKey: ["terms", "current"] });
        toast({ title: "Term deleted" });
        setTermDeleteTarget(null);
      })
      .catch((err) => toastError(toast, "Delete failed", err, "Could not delete term."))
      .finally(() => setTermDeleteLoading(false));
  }

  // ——— Program handlers ———
  function openProgramCreate() {
    setProgramFormState(emptyProgramForm);
    setProgramFormOpen("create");
  }
  function openProgramEdit(p: ProgramApi) {
    setProgramFormState({ name: p.name, description: p.description ?? "" });
    setProgramFormOpen(p);
  }
  function handleProgramFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const { name, description } = programFormState;
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setProgramFormSaving(true);
    if (programFormOpen === "create") {
      programsCreate({ name: name.trim(), description: description.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["programs"] });
          toast({ title: "Program created" });
          setProgramFormOpen(null);
        })
        .catch((err) => toastError(toast, "Create failed", err, "Could not create program."))
        .finally(() => setProgramFormSaving(false));
    } else if (typeof programFormOpen === "object") {
      programsPatch(programFormOpen.id, { name: name.trim(), description: description.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["programs"] });
          toast({ title: "Program updated" });
          setProgramFormOpen(null);
        })
        .catch((err) => toastError(toast, "Update failed", err, "Could not update program."))
        .finally(() => setProgramFormSaving(false));
    }
  }
  function handleProgramDelete() {
    if (!programDeleteTarget || !apiEnabled) return;
    setProgramDeleteLoading(true);
    programsDelete(programDeleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["programs"] });
        toast({ title: "Program deleted" });
        setProgramDeleteTarget(null);
      })
      .catch((err) => toastError(toast, "Delete failed", err, "Could not delete program."))
      .finally(() => setProgramDeleteLoading(false));
  }

  // ——— Location handlers ———
  function openLocationCreate() {
    setLocationFormState(emptyLocationForm);
    setLocationFormOpen("create");
  }
  function openLocationEdit(l: LocationApi) {
    setLocationFormState({ name: l.name, address: l.address ?? "" });
    setLocationFormOpen(l);
  }
  function handleLocationFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const { name, address } = locationFormState;
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setLocationFormSaving(true);
    if (locationFormOpen === "create") {
      locationsCreate({ name: name.trim(), address: address.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["locations"] });
          toast({ title: "Location created" });
          setLocationFormOpen(null);
        })
        .catch((err) => toastError(toast, "Create failed", err, "Could not create location."))
        .finally(() => setLocationFormSaving(false));
    } else if (typeof locationFormOpen === "object") {
      locationsPatch(locationFormOpen.id, { name: name.trim(), address: address.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["locations"] });
          toast({ title: "Location updated" });
          setLocationFormOpen(null);
        })
        .catch((err) => toastError(toast, "Update failed", err, "Could not update location."))
        .finally(() => setLocationFormSaving(false));
    }
  }
  function handleLocationDelete() {
    if (!locationDeleteTarget || !apiEnabled) return;
    setLocationDeleteLoading(true);
    locationsDelete(locationDeleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["locations"] });
        toast({ title: "Location deleted" });
        setLocationDeleteTarget(null);
      })
      .catch((err) => toastError(toast, "Delete failed", err, "Could not delete location."))
      .finally(() => setLocationDeleteLoading(false));
  }

  // ——— Age group handlers ———
  function openAgeGroupCreate() {
    setAgeGroupFormState(emptyAgeGroupForm);
    setAgeGroupFormOpen("create");
  }
  function openAgeGroupEdit(a: AgeGroupApi) {
    setAgeGroupFormState({
      name: a.name,
      minAge: a.minAge != null ? String(a.minAge) : "",
      maxAge: a.maxAge != null ? String(a.maxAge) : "",
    });
    setAgeGroupFormOpen(a);
  }
  function handleAgeGroupFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const { name, minAge, maxAge } = ageGroupFormState;
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const min = minAge.trim() ? parseInt(minAge, 10) : null;
    const max = maxAge.trim() ? parseInt(maxAge, 10) : null;
    if ((minAge.trim() && !Number.isFinite(min)) || (maxAge.trim() && !Number.isFinite(max))) {
      toast({ title: "Invalid age", description: "Min and max age must be numbers.", variant: "destructive" });
      return;
    }
    setAgeGroupFormSaving(true);
    if (ageGroupFormOpen === "create") {
      ageGroupsCreate({ name: name.trim(), minAge: min ?? undefined, maxAge: max ?? undefined })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["ageGroups"] });
          toast({ title: "Age group created" });
          setAgeGroupFormOpen(null);
        })
        .catch((err) => toastError(toast, "Create failed", err, "Could not create age group."))
        .finally(() => setAgeGroupFormSaving(false));
    } else if (typeof ageGroupFormOpen === "object") {
      ageGroupsPatch(ageGroupFormOpen.id, { name: name.trim(), minAge: min, maxAge: max })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["ageGroups"] });
          toast({ title: "Age group updated" });
          setAgeGroupFormOpen(null);
        })
        .catch((err) => toastError(toast, "Update failed", err, "Could not update age group."))
        .finally(() => setAgeGroupFormSaving(false));
    }
  }
  function handleAgeGroupDelete() {
    if (!ageGroupDeleteTarget || !apiEnabled) return;
    setAgeGroupDeleteLoading(true);
    ageGroupsDelete(ageGroupDeleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["ageGroups"] });
        toast({ title: "Age group deleted" });
        setAgeGroupDeleteTarget(null);
      })
      .catch((err) => toastError(toast, "Delete failed", err, "Could not delete age group."))
      .finally(() => setAgeGroupDeleteLoading(false));
  }

  // ——— Income source handlers ———
  function openIncomeSourceCreate() {
    setIncomeSourceFormState(emptyIncomeSourceForm);
    setIncomeSourceFormOpen("create");
  }
  function openIncomeSourceEdit(i: IncomeSourceApi) {
    setIncomeSourceFormState({ name: i.name, code: i.code ?? "" });
    setIncomeSourceFormOpen(i);
  }
  function handleIncomeSourceFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const { name, code } = incomeSourceFormState;
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setIncomeSourceFormSaving(true);
    if (incomeSourceFormOpen === "create") {
      incomeSourcesCreate({ name: name.trim(), code: code.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["incomeSources"] });
          toast({ title: "Income source created" });
          setIncomeSourceFormOpen(null);
        })
        .catch((err) => toastError(toast, "Create failed", err, "Could not create income source."))
        .finally(() => setIncomeSourceFormSaving(false));
    } else if (typeof incomeSourceFormOpen === "object") {
      incomeSourcesPatch(incomeSourceFormOpen.id, { name: name.trim(), code: code.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["incomeSources"] });
          toast({ title: "Income source updated" });
          setIncomeSourceFormOpen(null);
        })
        .catch((err) => toastError(toast, "Update failed", err, "Could not update income source."))
        .finally(() => setIncomeSourceFormSaving(false));
    }
  }
  function handleIncomeSourceDelete() {
    if (!incomeSourceDeleteTarget || !apiEnabled) return;
    setIncomeSourceDeleteLoading(true);
    incomeSourcesDelete(incomeSourceDeleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["incomeSources"] });
        toast({ title: "Income source deleted" });
        setIncomeSourceDeleteTarget(null);
      })
      .catch((err) => toastError(toast, "Delete failed", err, "Could not delete income source."))
      .finally(() => setIncomeSourceDeleteLoading(false));
  }

  // ——— Expense category handlers ———
  function openExpenseCategoryCreate() {
    setExpenseCategoryFormState(emptyExpenseCategoryForm);
    setExpenseCategoryFormOpen("create");
  }
  function openExpenseCategoryEdit(c: ExpenseCategoryApi) {
    setExpenseCategoryFormState({ name: c.name, code: c.code ?? "" });
    setExpenseCategoryFormOpen(c);
  }
  function handleExpenseCategoryFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiEnabled || !isAdmin) return;
    const { name, code } = expenseCategoryFormState;
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setExpenseCategoryFormSaving(true);
    if (expenseCategoryFormOpen === "create") {
      expenseCategoriesCreate({ name: name.trim(), code: code.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
          toast({ title: "Expense category created" });
          setExpenseCategoryFormOpen(null);
        })
        .catch((err) => toastError(toast, "Create failed", err, "Could not create expense category."))
        .finally(() => setExpenseCategoryFormSaving(false));
    } else if (typeof expenseCategoryFormOpen === "object") {
      expenseCategoriesPatch(expenseCategoryFormOpen.id, { name: name.trim(), code: code.trim() || null })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
          toast({ title: "Expense category updated" });
          setExpenseCategoryFormOpen(null);
        })
        .catch((err) => toastError(toast, "Update failed", err, "Could not update expense category."))
        .finally(() => setExpenseCategoryFormSaving(false));
    }
  }
  function handleExpenseCategoryDelete() {
    if (!expenseCategoryDeleteTarget || !apiEnabled) return;
    setExpenseCategoryDeleteLoading(true);
    expenseCategoriesDelete(expenseCategoryDeleteTarget.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
        toast({ title: "Expense category deleted" });
        setExpenseCategoryDeleteTarget(null);
      })
      .catch((err) => toastError(toast, "Delete failed", err, "Could not delete expense category."))
      .finally(() => setExpenseCategoryDeleteLoading(false));
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Programs, terms, locations, age groups, and finance configuration. Admins can add, edit, and delete all items when the API is enabled.
        </p>
      </div>

      <Tabs defaultValue="academic" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="academic">Academic & program setup</TabsTrigger>
          <TabsTrigger value="finance">Finance configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-6">
          {/* Terms */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Terms
                  </CardTitle>
                  <CardDescription>Academic terms and date ranges.</CardDescription>
                </div>
                {apiEnabled && isAdmin && (
                  <Button onClick={openTermCreate} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add term
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {termsLoading && apiEnabled ? (
                <p className="text-sm text-muted-foreground">Loading terms…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      {apiEnabled && isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {termsList.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-sm">{formatDate(t.startDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(t.endDate)}</TableCell>
                        {apiEnabled && isAdmin && (
                          <TableCell className="space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openTermEdit(t)} title="Edit term">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setTermDeleteTarget(t as TermApi)} title="Delete term">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Programs */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Programs
                  </CardTitle>
                  <CardDescription>Learning programs offered.</CardDescription>
                </div>
                {apiEnabled && isAdmin && (
                  <Button onClick={openProgramCreate} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add program
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {programsLoading && apiEnabled ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      {apiEnabled && isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programsDisplay.map((p: { id: string; name: string; description?: string | null }) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.description ?? "—"}</TableCell>
                        {apiEnabled && isAdmin && (
                          <TableCell className="space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openProgramEdit(p as ProgramApi)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setProgramDeleteTarget(p as ProgramApi)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Locations
                  </CardTitle>
                  <CardDescription>Venues and rooms.</CardDescription>
                </div>
                {apiEnabled && isAdmin && (
                  <Button onClick={openLocationCreate} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add location
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {locationsLoading && apiEnabled ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      {apiEnabled && isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationsDisplay.map((loc: { id: string; name: string; address?: string | null }) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{loc.address ?? "—"}</TableCell>
                        {apiEnabled && isAdmin && (
                          <TableCell className="space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openLocationEdit(loc as LocationApi)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setLocationDeleteTarget(loc as LocationApi)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Age groups */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" /> Age groups
                  </CardTitle>
                  <CardDescription>Age ranges for classes.</CardDescription>
                </div>
                {apiEnabled && isAdmin && (
                  <Button onClick={openAgeGroupCreate} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add age group
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {ageGroupsLoading && apiEnabled ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age range</TableHead>
                      {apiEnabled && isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroupsDisplay.map((ag: { id: string; name: string; minAge?: number | null; maxAge?: number | null }) => (
                      <TableRow key={ag.id}>
                        <TableCell className="font-medium">{ag.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ag.minAge != null && ag.maxAge != null ? `${ag.minAge}–${ag.maxAge} years` : "—"}
                        </TableCell>
                        {apiEnabled && isAdmin && (
                          <TableCell className="space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openAgeGroupEdit(ag as AgeGroupApi)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setAgeGroupDeleteTarget(ag as AgeGroupApi)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          {/* Income sources */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Income sources
                  </CardTitle>
                  <CardDescription>Fee structures and income types.</CardDescription>
                </div>
                {apiEnabled && isAdmin && (
                  <Button onClick={openIncomeSourceCreate} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add income source
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {incomeSourcesLoading && apiEnabled ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      {apiEnabled && isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeSourcesDisplay.map((inc: { id: string; name: string; code?: string | null }) => (
                      <TableRow key={inc.id}>
                        <TableCell className="font-medium">{inc.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">{inc.code ?? "—"}</TableCell>
                        {apiEnabled && isAdmin && (
                          <TableCell className="space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openIncomeSourceEdit(inc as IncomeSourceApi)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIncomeSourceDeleteTarget(inc as IncomeSourceApi)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Expense categories */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" /> Expense categories
                  </CardTitle>
                  <CardDescription>Categories for expenses.</CardDescription>
                </div>
                {apiEnabled && isAdmin && (
                  <Button onClick={openExpenseCategoryCreate} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add category
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {expenseCategoriesLoading && apiEnabled ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      {apiEnabled && isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseCategoriesDisplay.map((cat: { id: string; name: string; code?: string | null }) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">{cat.code ?? "—"}</TableCell>
                        {apiEnabled && isAdmin && (
                          <TableCell className="space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openExpenseCategoryEdit(cat as ExpenseCategoryApi)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setExpenseCategoryDeleteTarget(cat as ExpenseCategoryApi)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Term dialog */}
      <Dialog open={termFormOpen !== null} onOpenChange={(open) => !open && setTermFormOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{termFormOpen === "create" ? "Add term" : "Edit term"}</DialogTitle>
            <DialogDescription>{termFormOpen === "create" ? "Create a new academic term." : "Update term name and dates."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTermFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="term-name">Name</Label>
              <Input id="term-name" value={termFormState.name} onChange={(e) => setTermFormState((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Term 1 2026" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="term-start">Start date</Label>
                <Input id="term-start" type="date" value={termFormState.startDate} onChange={(e) => setTermFormState((s) => ({ ...s, startDate: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="term-end">End date</Label>
                <Input id="term-end" type="date" value={termFormState.endDate} onChange={(e) => setTermFormState((s) => ({ ...s, endDate: e.target.value }))} required />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="term-current" checked={termFormState.isCurrent} onCheckedChange={(checked) => setTermFormState((s) => ({ ...s, isCurrent: checked === true }))} />
              <Label htmlFor="term-current" className="text-sm font-normal">Set as current term</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTermFormOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={termFormSaving}>{termFormSaving ? "Saving…" : termFormOpen === "create" ? "Add term" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Program dialog */}
      <Dialog open={programFormOpen !== null} onOpenChange={(open) => !open && setProgramFormOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{programFormOpen === "create" ? "Add program" : "Edit program"}</DialogTitle>
            <DialogDescription>Learning program name and description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProgramFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Name</Label>
              <Input id="program-name" value={programFormState.name} onChange={(e) => setProgramFormState((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Coding Basics" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-desc">Description</Label>
              <Input id="program-desc" value={programFormState.description} onChange={(e) => setProgramFormState((s) => ({ ...s, description: e.target.value }))} placeholder="Optional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProgramFormOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={programFormSaving}>{programFormSaving ? "Saving…" : programFormOpen === "create" ? "Add program" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Location dialog */}
      <Dialog open={locationFormOpen !== null} onOpenChange={(open) => !open && setLocationFormOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{locationFormOpen === "create" ? "Add location" : "Edit location"}</DialogTitle>
            <DialogDescription>Venue or room name and address.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLocationFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Name</Label>
              <Input id="location-name" value={locationFormState.name} onChange={(e) => setLocationFormState((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Room A" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-address">Address</Label>
              <Input id="location-address" value={locationFormState.address} onChange={(e) => setLocationFormState((s) => ({ ...s, address: e.target.value }))} placeholder="Optional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLocationFormOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={locationFormSaving}>{locationFormSaving ? "Saving…" : locationFormOpen === "create" ? "Add location" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Age group dialog */}
      <Dialog open={ageGroupFormOpen !== null} onOpenChange={(open) => !open && setAgeGroupFormOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{ageGroupFormOpen === "create" ? "Add age group" : "Edit age group"}</DialogTitle>
            <DialogDescription>Name and optional min/max age range.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAgeGroupFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agegroup-name">Name</Label>
              <Input id="agegroup-name" value={ageGroupFormState.name} onChange={(e) => setAgeGroupFormState((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. 8-10" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agegroup-min">Min age</Label>
                <Input id="agegroup-min" type="number" min={0} value={ageGroupFormState.minAge} onChange={(e) => setAgeGroupFormState((s) => ({ ...s, minAge: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agegroup-max">Max age</Label>
                <Input id="agegroup-max" type="number" min={0} value={ageGroupFormState.maxAge} onChange={(e) => setAgeGroupFormState((s) => ({ ...s, maxAge: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAgeGroupFormOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={ageGroupFormSaving}>{ageGroupFormSaving ? "Saving…" : ageGroupFormOpen === "create" ? "Add age group" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Income source dialog */}
      <Dialog open={incomeSourceFormOpen !== null} onOpenChange={(open) => !open && setIncomeSourceFormOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{incomeSourceFormOpen === "create" ? "Add income source" : "Edit income source"}</DialogTitle>
            <DialogDescription>Name and optional code.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIncomeSourceFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income-name">Name</Label>
              <Input id="income-name" value={incomeSourceFormState.name} onChange={(e) => setIncomeSourceFormState((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. School STEM Club" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-code">Code</Label>
              <Input id="income-code" value={incomeSourceFormState.code} onChange={(e) => setIncomeSourceFormState((s) => ({ ...s, code: e.target.value }))} placeholder="e.g. STEM" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIncomeSourceFormOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={incomeSourceFormSaving}>{incomeSourceFormSaving ? "Saving…" : incomeSourceFormOpen === "create" ? "Add income source" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense category dialog */}
      <Dialog open={expenseCategoryFormOpen !== null} onOpenChange={(open) => !open && setExpenseCategoryFormOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{expenseCategoryFormOpen === "create" ? "Add expense category" : "Edit expense category"}</DialogTitle>
            <DialogDescription>Name and optional code.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleExpenseCategoryFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Name</Label>
              <Input id="expense-name" value={expenseCategoryFormState.name} onChange={(e) => setExpenseCategoryFormState((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Rent" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-code">Code</Label>
              <Input id="expense-code" value={expenseCategoryFormState.code} onChange={(e) => setExpenseCategoryFormState((s) => ({ ...s, code: e.target.value }))} placeholder="e.g. RENT" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseCategoryFormOpen(null)}>Cancel</Button>
              <Button type="submit" disabled={expenseCategoryFormSaving}>{expenseCategoryFormSaving ? "Saving…" : expenseCategoryFormOpen === "create" ? "Add category" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmations */}
      <AlertDialog open={!!termDeleteTarget} onOpenChange={(open) => !open && setTermDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete term</AlertDialogTitle>
            <AlertDialogDescription>{termDeleteTarget && <>Permanently delete <strong>{termDeleteTarget.name}</strong>? This cannot be undone.</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={termDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleTermDelete(); }} disabled={termDeleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{termDeleteLoading ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!programDeleteTarget} onOpenChange={(open) => !open && setProgramDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete program</AlertDialogTitle>
            <AlertDialogDescription>{programDeleteTarget && <>Permanently delete <strong>{programDeleteTarget.name}</strong>?</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={programDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleProgramDelete(); }} disabled={programDeleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{programDeleteLoading ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!locationDeleteTarget} onOpenChange={(open) => !open && setLocationDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location</AlertDialogTitle>
            <AlertDialogDescription>{locationDeleteTarget && <>Permanently delete <strong>{locationDeleteTarget.name}</strong>?</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={locationDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleLocationDelete(); }} disabled={locationDeleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{locationDeleteLoading ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!ageGroupDeleteTarget} onOpenChange={(open) => !open && setAgeGroupDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete age group</AlertDialogTitle>
            <AlertDialogDescription>{ageGroupDeleteTarget && <>Permanently delete <strong>{ageGroupDeleteTarget.name}</strong>?</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ageGroupDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleAgeGroupDelete(); }} disabled={ageGroupDeleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{ageGroupDeleteLoading ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!incomeSourceDeleteTarget} onOpenChange={(open) => !open && setIncomeSourceDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete income source</AlertDialogTitle>
            <AlertDialogDescription>{incomeSourceDeleteTarget && <>Permanently delete <strong>{incomeSourceDeleteTarget.name}</strong>?</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={incomeSourceDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleIncomeSourceDelete(); }} disabled={incomeSourceDeleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{incomeSourceDeleteLoading ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!expenseCategoryDeleteTarget} onOpenChange={(open) => !open && setExpenseCategoryDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense category</AlertDialogTitle>
            <AlertDialogDescription>{expenseCategoryDeleteTarget && <>Permanently delete <strong>{expenseCategoryDeleteTarget.name}</strong>?</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={expenseCategoryDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleExpenseCategoryDelete(); }} disabled={expenseCategoryDeleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{expenseCategoryDeleteLoading ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

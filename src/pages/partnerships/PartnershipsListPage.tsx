import { useMemo, useState } from "react";
import { usePartnerships } from "@/context/PartnershipsContext";
import type { Partnership, PartnershipProgramType } from "@/types";
import { PARTNERSHIP_PROGRAM_TYPES } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  isApiEnabled,
  partnersGetOrganisations,
  partnersGetParents,
  organisationsUpdate,
  organisationsDelete,
  type OrganisationPartnerApi,
  type ParentPartnerApi,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusVariant: Record<Partnership["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
};

const ORG_TYPES = [
  { value: "school", label: "School" },
  { value: "organisation", label: "Organisation" },
  { value: "miradi", label: "Miradi" },
  { value: "other", label: "Other" },
] as const;

export default function PartnershipsListPage() {
  const { partnerships: ctxPartnerships, addPartnership } = usePartnerships();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    programType: "" as PartnershipProgramType | "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    status: "active" as Partnership["status"],
    notes: "",
  });

  const [editingOrg, setEditingOrg] = useState<OrganisationPartnerApi | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    location: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OrganisationPartnerApi | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const apiEnabled = isApiEnabled();
  const canEditDeleteOrgs = apiEnabled && isAdmin;

  const { data: orgPartners = [], isLoading: orgsLoading } = useQuery<OrganisationPartnerApi[]>({
    queryKey: ["partners", "organisations"],
    queryFn: partnersGetOrganisations,
    enabled: apiEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: parentPartners = [], isLoading: parentsLoading } = useQuery<ParentPartnerApi[]>({
    queryKey: ["partners", "parents"],
    queryFn: partnersGetParents,
    enabled: apiEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const partnerships: Partnership[] = useMemo(() => {
    if (!apiEnabled) return ctxPartnerships;

    const fromOrgs: Partnership[] = orgPartners.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type || "Organisation",
      programType: undefined,
      contactPerson: o.contactPerson,
      contactEmail: o.contactEmail || undefined,
      contactPhone: o.contactPhone || undefined,
      status: "active",
      createdAt: o.createdAt,
    }));

    const fromParents: Partnership[] = parentPartners.map((p) => ({
      id: p.id,
      name: p.name,
      type: "Parent",
      programType: undefined,
      contactPerson: p.name,
      contactEmail: p.email || undefined,
      contactPhone: p.contactPhone || undefined,
      status: p.status as Partnership["status"],
      createdAt: p.createdAt,
    }));

    return [...fromOrgs, ...fromParents];
  }, [apiEnabled, ctxPartnerships, orgPartners, parentPartners]);

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    addPartnership({
      name: form.name.trim(),
      type: form.type.trim() || "Partner",
      programType: form.programType || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
    });
    toast({ title: "Partnership added" });
    setForm({ name: "", type: "", programType: "", contactPerson: "", contactEmail: "", contactPhone: "", status: "active", notes: "" });
    setDialogOpen(false);
  };

  const openEdit = (org: OrganisationPartnerApi) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name,
      type: org.type || "",
      contactPerson: org.contactPerson || "",
      contactEmail: org.contactEmail || "",
      contactPhone: org.contactPhone || "",
      location: org.location || "",
    });
  };

  const handleEditSave = async () => {
    if (!editingOrg || !editForm.name.trim()) return;
    setEditSaving(true);
    try {
      await organisationsUpdate(editingOrg.id, {
        name: editForm.name.trim(),
        type: editForm.type.trim() || undefined,
        contactPerson: editForm.contactPerson.trim() || undefined,
        contactEmail: editForm.contactEmail.trim() || undefined,
        contactPhone: editForm.contactPhone.trim() || undefined,
        location: editForm.location.trim() || undefined,
      });
      toast({ title: "Partner updated" });
      queryClient.invalidateQueries({ queryKey: ["partners", "organisations"] });
      setEditingOrg(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Update failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await organisationsDelete(deleteTarget.id);
      toast({ title: "Partner removed" });
      queryClient.invalidateQueries({ queryKey: ["partners", "organisations"] });
      setDeleteTarget(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const orgIds = useMemo(() => new Set(orgPartners.map((o) => o.id)), [orgPartners]);

  const activeFirst = [...partnerships].sort((a, b) => {
    const order = { active: 0, pending: 1, inactive: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active partnerships</h1>
          <p className="text-muted-foreground">
            Add and manage all active partnerships. {canEditDeleteOrgs ? "Admins can edit and delete organisation partners below." : "Only Partnership & Communications can edit this list."}
          </p>
        </div>
        {!apiEnabled && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add partnership
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Program type</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Added</TableHead>
              {canEditDeleteOrgs && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeFirst.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEditDeleteOrgs ? 7 : 6} className="text-center text-muted-foreground py-8">
                  No partnerships yet. Click &quot;Add partnership&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              activeFirst.map((p) => {
                const isOrg = orgIds.has(p.id);
                const org = isOrg ? orgPartners.find((o) => o.id === p.id) : null;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.programType || "—"}</TableCell>
                    <TableCell>{p.type || "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {p.contactPerson && <span className="block">{p.contactPerson}</span>}
                        {p.contactEmail && <span className="text-muted-foreground">{p.contactEmail}</span>}
                        {p.contactPhone && <span className="text-muted-foreground block">{p.contactPhone}</span>}
                        {!p.contactPerson && !p.contactEmail && !p.contactPhone && "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {p.createdAt}
                    </TableCell>
                    {canEditDeleteOrgs && (
                      <TableCell>
                        {org ? (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(org)} title="Edit partner">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(org)} title="Delete partner">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add partnership</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Partnership name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Riverside Academy"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="programType">Program type</Label>
              <Select
                value={form.programType || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, programType: v as PartnershipProgramType }))}
              >
                <SelectTrigger id="programType">
                  <SelectValue placeholder="Select what type of program this partnership falls under" />
                </SelectTrigger>
                <SelectContent>
                  {PARTNERSHIP_PROGRAM_TYPES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the program(s) this partnership is associated with.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Organisation type (optional)</Label>
              <Input
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="e.g. School, Church, NGO"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input
                id="contactPerson"
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                placeholder="Name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+27 ..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: Partnership["status"]) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add partnership</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit organisation partner (admin, API only) */}
      <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit partner</DialogTitle>
            <p className="text-sm text-muted-foreground">Update organisation details. Changes apply to this partner record.</p>
          </DialogHeader>
          {editingOrg && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Riverside Academy"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editForm.type || "other"}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactPerson">Contact person</Label>
                <Input
                  id="edit-contactPerson"
                  value={editForm.contactPerson}
                  onChange={(e) => setEditForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  placeholder="Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactEmail">Contact email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactPhone">Contact phone</Label>
                <Input
                  id="edit-contactPhone"
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="+254 ..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Nairobi"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrg(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={editSaving || !editForm.name.trim()}>
              {editSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete organisation partner confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleteLoading && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove partner?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  This will remove <strong>{deleteTarget.name}</strong> from the partners list. Any linked user account will be unlinked (they will no longer be associated with this organisation). This cannot be undone.
                  <p className="mt-2 text-sm">You cannot delete a partner that has learners linked to it. Reassign or remove those learners first.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading ? "Removing…" : "Remove partner"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

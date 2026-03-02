import { useState } from "react";
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
import { Plus } from "lucide-react";

const statusVariant: Record<Partnership["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
};

export default function PartnershipsListPage() {
  const { partnerships, addPartnership } = usePartnerships();
  const { toast } = useToast();
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
            Add and manage all active partnerships. Only Partnership & Communications can edit this list.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add partnership
        </Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeFirst.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No partnerships yet. Click &quot;Add partnership&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              activeFirst.map((p) => (
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
                </TableRow>
              ))
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
    </div>
  );
}

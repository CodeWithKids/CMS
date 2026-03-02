import { useState } from "react";
import { useMarketing } from "@/context/MarketingContext";
import { usePartnerships } from "@/context/PartnershipsContext";
import type { MarketingCampaign } from "@/types";
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

const statusVariant: Record<MarketingCampaign["status"], "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  active: "default",
  completed: "outline",
  paused: "destructive",
};

export default function MarketingCampaignsPage() {
  const { campaigns, addCampaign } = useMarketing();
  const { partnerships } = usePartnerships();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    channel: "",
    status: "draft" as MarketingCampaign["status"],
    startDate: "",
    endDate: "",
    partnershipId: "",
    notes: "",
  });

  const getPartnershipName = (id: string) => partnerships.find((p) => p.id === id)?.name ?? "—";

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast({ title: "Campaign name required", variant: "destructive" });
      return;
    }
    addCampaign({
      name: form.name.trim(),
      type: form.type.trim() || "Campaign",
      channel: form.channel.trim() || undefined,
      status: form.status,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      partnershipId: form.partnershipId || undefined,
      notes: form.notes.trim() || undefined,
    });
    toast({ title: "Campaign added" });
    setForm({ name: "", type: "", channel: "", status: "draft", startDate: "", endDate: "", partnershipId: "", notes: "" });
    setDialogOpen(false);
  };

  const statusOrder = { active: 0, draft: 1, paused: 2, completed: 3 };
  const sortedCampaigns = [...campaigns].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Add and manage marketing campaigns. Link campaigns to partnerships to align with Partnership & Communications.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add campaign
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Partnership</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No campaigns yet. Click &quot;Add campaign&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              sortedCampaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.type || "—"}</TableCell>
                  <TableCell>{c.channel || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.partnershipId ? getPartnershipName(c.partnershipId) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.startDate && c.endDate
                      ? `${c.startDate} – ${c.endDate}`
                      : c.startDate
                        ? `From ${c.startDate}`
                        : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {c.createdAt}
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
            <DialogTitle>Add campaign</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Campaign name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. STEM Fair 2026"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="e.g. Social, Email, Event, Print"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="channel">Channel</Label>
              <Input
                id="channel"
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                placeholder="e.g. Facebook, Instagram, Newsletter"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="partnership">Related partnership</Label>
              <Select
                value={form.partnershipId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, partnershipId: v === "none" ? "" : v }))}
              >
                <SelectTrigger id="partnership">
                  <SelectValue placeholder="Optional — link to a partnership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {partnerships.filter((p) => p.status === "active").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Partnership & Communications can see campaigns linked to their partnerships.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: MarketingCampaign["status"]) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
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
            <Button onClick={handleAdd}>Add campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

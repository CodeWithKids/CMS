import { useState, useMemo } from "react";
import { useProspectsStore } from "./stores/prospectsStore";
import type {
  Prospect,
  ProspectType,
  ProspectInterest,
  ProspectStage,
} from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROSPECT_TYPES: ProspectType[] = [
  "SCHOOL",
  "NGO",
  "COMPANY",
  "FOUNDATION",
  "CHURCH",
  "CBO",
  "INDIVIDUAL",
];

const INTEREST_OPTIONS: ProspectInterest[] = [
  "PROGRAMME_PARTNER",
  "IN_KIND_EQUIPMENT",
  "FINANCIAL_SUPPORT",
  "VOLUNTEERS",
  "OTHER",
];

const STAGE_OPTIONS: ProspectStage[] = [
  "NEW",
  "CONTACTED",
  "MEETING",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
];

const stageVariant: Record<ProspectStage, "secondary" | "default" | "outline"> = {
  NEW: "secondary",
  CONTACTED: "outline",
  MEETING: "outline",
  PROPOSAL_SENT: "outline",
  NEGOTIATION: "default",
  CONVERTED: "default",
  LOST: "secondary",
};

function formatInterest(s: ProspectInterest): string {
  return s
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

const emptyProspectForm = {
  name: "",
  type: "SCHOOL" as ProspectType,
  interestAreas: [] as ProspectInterest[],
  location: "",
  mainContactName: "",
  mainContactEmail: "",
  mainContactPhone: "",
  stage: "NEW" as ProspectStage,
  potentialValueKes: undefined as number | undefined,
  notes: "",
};

export default function PartnershipProspectsPage() {
  const { prospects, addProspect, updateProspect, getProspect } = useProspectsStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterInterest, setFilterInterest] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState(emptyProspectForm);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.mainContactName?.toLowerCase().includes(q) &&
          !p.mainContactEmail?.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterType !== "all" && p.type !== filterType) return false;
      if (filterInterest !== "all" && !p.interestAreas.includes(filterInterest as ProspectInterest))
        return false;
      if (filterStage !== "all" && p.stage !== filterStage) return false;
      return true;
    });
  }, [prospects, search, filterType, filterInterest, filterStage]);

  const handleAdd = () => {
    if (!addForm.name.trim()) return;
    try {
      addProspect({
        ...addForm,
        interestAreas: addForm.interestAreas.length ? addForm.interestAreas : ["OTHER"],
        location: addForm.location || undefined,
        mainContactName: addForm.mainContactName || undefined,
        mainContactEmail: addForm.mainContactEmail || undefined,
        mainContactPhone: addForm.mainContactPhone || undefined,
        potentialValueKes: addForm.potentialValueKes,
        notes: addForm.notes || undefined,
      });
      setAddForm(emptyProspectForm);
      setAddOpen(false);
      toast({ title: "Prospect added", description: `${addForm.name.trim()} has been added to your pipeline.` });
    } catch (e) {
      toast({ title: "Could not add prospect", description: "Please try again.", variant: "destructive" });
    }
  };

  const prospectDetail = detailId ? getProspect(detailId) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prospects</h1>
        <p className="text-muted-foreground">
          Track potential partners, donors, and in-kind supporters.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <Input
            placeholder="Name, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] mt-1">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {PROSPECT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Interest</Label>
          <Select value={filterInterest} onValueChange={setFilterInterest}>
            <SelectTrigger className="w-[180px] mt-1">
              <SelectValue placeholder="All interests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All interests</SelectItem>
              {INTEREST_OPTIONS.map((i) => (
                <SelectItem key={i} value={i}>
                  {formatInterest(i)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Stage</Label>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[140px] mt-1">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add prospect
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Interest areas</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Potential value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No prospects match the current filters.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {prospects.length === 0 ? "Add your first prospect using the button above." : "Try clearing filters or adding a new prospect."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.interestAreas.map((i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {formatInterest(i)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stageVariant[p.stage]}>{p.stage.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.potentialValueKes != null
                      ? `KES ${p.potentialValueKes.toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetailId(p.id)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      View / Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add prospect dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add prospect</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Organisation or contact name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={addForm.type}
                onValueChange={(v) => setAddForm((f) => ({ ...f, type: v as ProspectType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROSPECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Interest areas</Label>
              <Select
                value={addForm.interestAreas[0] ?? ""}
                onValueChange={(v) =>
                  setAddForm((f) => ({
                    ...f,
                    interestAreas: v ? [v as ProspectInterest] : [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select one" />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {formatInterest(i)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-location">Location</Label>
              <Input
                id="add-location"
                value={addForm.location}
                onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City or region"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-contact">Contact name</Label>
              <Input
                id="add-contact"
                value={addForm.mainContactName}
                onChange={(e) => setAddForm((f) => ({ ...f, mainContactName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">Contact email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.mainContactEmail}
                onChange={(e) => setAddForm((f) => ({ ...f, mainContactEmail: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Stage</Label>
              <Select
                value={addForm.stage}
                onValueChange={(v) => setAddForm((f) => ({ ...f, stage: v as ProspectStage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={addForm.notes}
                onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!addForm.name.trim()}>
              Add prospect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Edit detail dialog */}
      {prospectDetail && (
        <ProspectDetailDialog
          prospect={prospectDetail}
          onClose={() => setDetailId(null)}
          onUpdate={(patch) => {
            updateProspect(prospectDetail.id, patch);
          }}
        />
      )}
    </div>
  );
}

function ProspectDetailDialog({
  prospect,
  onClose,
  onUpdate,
}: {
  prospect: Prospect;
  onClose: () => void;
  onUpdate: (patch: Partial<Prospect>) => void;
}) {
  const [stage, setStage] = useState(prospect.stage);
  const [notes, setNotes] = useState(prospect.notes ?? "");

  const { toast } = useToast();
  const handleSave = () => {
    onUpdate({ stage, notes: notes || undefined });
    onClose();
    toast({ title: "Prospect updated", description: "Changes have been saved." });
  };

  return (
    <Dialog open={!!prospect} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prospect.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Basic info</p>
            <p className="font-medium">{prospect.name}</p>
            <p className="text-sm">Type: {prospect.type}</p>
            {prospect.location && (
              <p className="text-sm text-muted-foreground">Location: {prospect.location}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact</p>
            {prospect.mainContactName && (
              <p className="text-sm">{prospect.mainContactName}</p>
            )}
            {prospect.mainContactEmail && (
              <p className="text-sm text-muted-foreground">{prospect.mainContactEmail}</p>
            )}
            {prospect.mainContactPhone && (
              <p className="text-sm text-muted-foreground">{prospect.mainContactPhone}</p>
            )}
            {!prospect.mainContactName && !prospect.mainContactEmail && !prospect.mainContactPhone && (
              <p className="text-sm text-muted-foreground">No contact details</p>
            )}
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as ProspectStage)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Interest areas</p>
            <div className="flex flex-wrap gap-1">
              {prospect.interestAreas.map((i) => (
                <Badge key={i} variant="outline">
                  {formatInterest(i)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="detail-notes">Notes</Label>
            <Textarea
              id="detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          {(prospect.linkedCampaignIds?.length || prospect.linkedEventIds?.length) ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Linked items</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {prospect.linkedCampaignIds?.map((id) => (
                  <Badge key={id} variant="secondary">
                    Campaign: {id}
                  </Badge>
                ))}
                {prospect.linkedEventIds?.map((id) => (
                  <Badge key={id} variant="secondary">
                    Event: {id}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

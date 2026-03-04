import { useState, useMemo } from "react";
import { useGrantsStore } from "./stores/grantsStore";
import { useReceivedDonations } from "./stores/receivedDonationsStore";
import { usePartnerships } from "@/context/PartnershipsContext";
import type {
  GrantOpportunity,
  FundingType,
  FundingStage,
} from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const FUNDING_TYPES: FundingType[] = ["GRANT", "CSR", "SPONSORSHIP", "DONATION"];

const STAGE_OPTIONS: FundingStage[] = [
  "IDEA",
  "SCOPING",
  "APPLYING",
  "SUBMITTED",
  "AWARDED",
  "DECLINED",
];

const stageVariant: Record<FundingStage, "secondary" | "default" | "outline"> = {
  IDEA: "secondary",
  SCOPING: "outline",
  APPLYING: "outline",
  SUBMITTED: "outline",
  AWARDED: "default",
  DECLINED: "secondary",
};

const currentYear = new Date().getFullYear();
const now = new Date();
const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

function isDeadlineWithinDays(deadline: string | undefined, days: number): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d >= now && d <= end;
}

function isAwardedThisYear(o: GrantOpportunity): boolean {
  if (o.stage !== "AWARDED" || !o.awardedDate) return false;
  return o.awardedDate.startsWith(String(currentYear));
}

const emptyForm = {
  name: "",
  funderName: "",
  fundingType: "GRANT" as FundingType,
  amountKes: undefined as number | undefined,
  currency: "KES",
  country: "",
  programmeFocus: "",
  deadline: "",
  stage: "IDEA" as FundingStage,
  probability: undefined as number | undefined,
  expectedDecisionDate: "",
  leadName: "",
  assistantNamesRaw: "" as string, // comma-separated, split on save
  notes: "",
};

export default function PartnershipGrantsPage() {
  const { opportunities, addOpportunity, updateOpportunity, getOpportunity } = useGrantsStore();
  const { getDonationsForYear } = useReceivedDonations();
  const { partnerships } = usePartnerships();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterFocus, setFilterFocus] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const activeOpportunities = useMemo(
    () => opportunities.filter((o) => o.stage !== "AWARDED" && o.stage !== "DECLINED"),
    [opportunities]
  );
  const pipelineValue = useMemo(
    () => activeOpportunities.reduce((sum, o) => sum + (o.amountKes ?? 0), 0),
    [activeOpportunities]
  );
  const securedThisYear = useMemo(() => {
    const fromGrants = opportunities
      .filter(isAwardedThisYear)
      .reduce((sum, o) => sum + (o.amountKes ?? 0), 0);
    const fromDonations = getDonationsForYear(currentYear).reduce((sum, d) => sum + d.amountKes, 0);
    return fromGrants + fromDonations;
  }, [opportunities, getDonationsForYear]);
  const upcomingDeadlines = useMemo(
    () => opportunities.filter((o) => isDeadlineWithinDays(o.deadline, 30)).length,
    [opportunities]
  );

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (filterType !== "all" && o.fundingType !== filterType) return false;
      if (filterStage !== "all" && o.stage !== filterStage) return false;
      if (
        filterFocus.trim() &&
        !(o.programmeFocus?.toLowerCase().includes(filterFocus.toLowerCase()) ?? false)
      )
        return false;
      return true;
    });
  }, [opportunities, filterType, filterStage, filterFocus]);

  const handleAdd = () => {
    if (!form.name.trim() || !form.funderName.trim()) return;
    try {
      const assistantNames = form.assistantNamesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      addOpportunity({
        name: form.name.trim(),
        funderName: form.funderName.trim(),
        fundingType: form.fundingType,
        amountKes: form.amountKes,
        currency: form.currency || undefined,
        country: form.country || undefined,
        programmeFocus: form.programmeFocus || undefined,
        deadline: form.deadline || undefined,
        stage: form.stage,
        probability: form.probability,
        expectedDecisionDate: form.expectedDecisionDate || undefined,
        leadName: form.leadName.trim() || undefined,
        assistantNames: assistantNames.length > 0 ? assistantNames : undefined,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      setAddOpen(false);
      toast({ title: "Opportunity added", description: `${form.name.trim()} has been added to the pipeline.` });
    } catch (e) {
      toast({ title: "Could not add opportunity", description: "Please try again.", variant: "destructive" });
    }
  };

  const opportunityDetail = detailId ? getOpportunity(detailId) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grants & funding</h1>
        <p className="text-muted-foreground">
          Track grants, CSR, sponsorships, and funding opportunities from discovery to awarded.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Active opportunities</p>
          <p className="text-2xl font-bold">{activeOpportunities.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Pipeline value</p>
          <p className="text-2xl font-bold">
            KES {pipelineValue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Secured this year</p>
          <p className="text-2xl font-bold">
            KES {securedThisYear.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Upcoming deadlines (30d)</p>
          <p className="text-2xl font-bold">{upcomingDeadlines}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-xs text-muted-foreground">Funding type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] mt-1">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {FUNDING_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Stage</Label>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[140px] mt-1">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STAGE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs text-muted-foreground">Programme focus</Label>
          <Input
            placeholder="e.g. robotics, scholarships"
            value={filterFocus}
            onChange={(e) => setFilterFocus(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add opportunity
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Funder</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Assisting</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Linked partner</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No opportunities match the filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell>{o.funderName}</TableCell>
                  <TableCell>{o.fundingType}</TableCell>
                  <TableCell>
                    <Badge variant={stageVariant[o.stage]}>{o.stage}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{o.leadName ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate" title={o.assistantNames?.join(", ") ?? ""}>
                    {o.assistantNames?.length ? o.assistantNames.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    {o.amountKes != null
                      ? `${o.currency ?? "KES"} ${o.amountKes.toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell>{o.deadline ?? "—"}</TableCell>
                  <TableCell>
                    {o.linkedPartnerId
                      ? partnerships.find((p) => p.id === o.linkedPartnerId)?.name ?? o.linkedPartnerId
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetailId(o.id)}>
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

      {/* Add opportunity dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add opportunity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. STEM Scale-Up 2026"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-funder">Funder name *</Label>
              <Input
                id="add-funder"
                value={form.funderName}
                onChange={(e) => setForm((f) => ({ ...f, funderName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Funding type</Label>
              <Select
                value={form.fundingType}
                onValueChange={(v) => setForm((f) => ({ ...f, fundingType: v as FundingType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-amount">Amount (KES)</Label>
              <Input
                id="add-amount"
                type="number"
                value={form.amountKes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amountKes: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-focus">Programme focus</Label>
              <Input
                id="add-focus"
                value={form.programmeFocus}
                onChange={(e) => setForm((f) => ({ ...f, programmeFocus: e.target.value }))}
                placeholder="e.g. robotics, girls in STEM"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-deadline">Deadline</Label>
              <Input
                id="add-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => setForm((f) => ({ ...f, stage: v as FundingStage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-lead">Lead (application lead)</Label>
              <Input
                id="add-lead"
                value={form.leadName}
                onChange={(e) => setForm((f) => ({ ...f, leadName: e.target.value }))}
                placeholder="e.g. Jane Wanjiku"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-assistants">Assisting (comma-separated)</Label>
              <Input
                id="add-assistants"
                value={form.assistantNamesRaw}
                onChange={(e) => setForm((f) => ({ ...f, assistantNamesRaw: e.target.value }))}
                placeholder="e.g. Peter Ochieng, Mary Akinyi"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!form.name.trim() || !form.funderName.trim()}>
              Add opportunity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {opportunityDetail && (
        <GrantDetailDialog
          opportunity={opportunityDetail}
          partnerships={partnerships}
          onClose={() => setDetailId(null)}
          onUpdate={(patch) => {
            updateOpportunity(opportunityDetail.id, patch);
            toast({ title: "Opportunity updated", description: "Changes have been saved." });
          }}
        />
      )}
    </div>
  );
}

function GrantDetailDialog({
  opportunity,
  partnerships,
  onClose,
  onUpdate,
}: {
  opportunity: GrantOpportunity;
  partnerships: { id: string; name: string }[];
  onClose: () => void;
  onUpdate: (patch: Partial<GrantOpportunity>) => void;
}) {
  const [stage, setStage] = useState(opportunity.stage);
  const [notes, setNotes] = useState(opportunity.notes ?? "");
  const [linkedPartnerId, setLinkedPartnerId] = useState(opportunity.linkedPartnerId ?? "");
  const [leadName, setLeadName] = useState(opportunity.leadName ?? "");
  const [assistantNamesRaw, setAssistantNamesRaw] = useState(
    (opportunity.assistantNames ?? []).join(", ")
  );

  const handleSave = () => {
    const assistantNames = assistantNamesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdate({
      stage,
      notes: notes || undefined,
      linkedPartnerId: linkedPartnerId || undefined,
      leadName: leadName.trim() || undefined,
      assistantNames: assistantNames.length > 0 ? assistantNames : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={!!opportunity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opportunity.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Funder</p>
            <p className="font-medium">{opportunity.funderName}</p>
            <p className="text-sm">{opportunity.fundingType}</p>
            {opportunity.amountKes != null && (
              <p className="text-sm">
                {opportunity.currency ?? "KES"} {opportunity.amountKes.toLocaleString()}
              </p>
            )}
          </div>
          {opportunity.programmeFocus && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Programme focus</p>
              <p className="text-sm">{opportunity.programmeFocus}</p>
            </div>
          )}
          {opportunity.deadline && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deadline</p>
              <p className="text-sm">{opportunity.deadline}</p>
            </div>
          )}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <p className="text-sm font-semibold">Grant team</p>
            <div>
              <Label className="text-xs text-muted-foreground">Lead (application lead)</Label>
              <Input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Person leading the application"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Assisting (comma-separated)</Label>
              <Input
                value={assistantNamesRaw}
                onChange={(e) => setAssistantNamesRaw(e.target.value)}
                placeholder="e.g. Peter Ochieng, Mary Akinyi"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as FundingStage)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Linked partner</Label>
            <Select value={linkedPartnerId} onValueChange={setLinkedPartnerId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {partnerships.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="grant-notes">Notes</Label>
            <Textarea
              id="grant-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Linked items</p>
            <p className="text-xs text-muted-foreground mt-1">
              Campaigns and events links can be added here later.
            </p>
          </div>
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

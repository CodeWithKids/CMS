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
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";

const statusVariant: Record<MarketingCampaign["status"], "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  active: "default",
  completed: "outline",
  paused: "destructive",
};

/**
 * Read-only view for Partnership & Communications: campaigns linked to active partnerships.
 * Links Partnership & Communications with Marketing & Strategies — same campaign data, different role.
 */
export default function PartnershipsCampaignsPage() {
  const { campaigns } = useMarketing();
  const { partnerships } = usePartnerships();

  const partnershipIds = new Set(partnerships.map((p) => p.id));
  const linkedCampaigns = campaigns.filter((c) => c.partnershipId && partnershipIds.has(c.partnershipId));
  const getPartnershipName = (id: string) => partnerships.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns linked to partnerships</h1>
        <p className="text-muted-foreground">
          Marketing & Strategies can link campaigns to your partnerships. Here you see those campaigns (read-only).
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Partnership</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No campaigns linked to your partnerships yet.</p>
                  <p className="text-sm mt-1">Marketing & Strategies can link campaigns when adding or editing them.</p>
                </TableCell>
              </TableRow>
            ) : (
              linkedCampaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.partnershipId ? getPartnershipName(c.partnershipId) : "—"}</TableCell>
                  <TableCell>{c.type || "—"}</TableCell>
                  <TableCell>{c.channel || "—"}</TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

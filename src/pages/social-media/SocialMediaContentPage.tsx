import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSocialMedia } from "@/context/SocialMediaContext";
import { useMarketing } from "@/context/MarketingContext";
import { useAuth } from "@/context/AuthContext";
import type { SocialPost } from "@/types";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Share2, Pencil, Trash2, Calendar as CalendarIcon, TableIcon, ExternalLink, Info } from "lucide-react";

const statusVariant: Record<SocialPost["status"], "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  pending_review: "outline",
  approved: "default",
  scheduled: "outline",
  published: "default",
};

const emptyForm = {
  platform: "Facebook",
  title: "",
  status: "draft" as SocialPost["status"],
  scheduledDate: "",
  linkedCampaignId: "",
  notes: "",
};

export default function SocialMediaContentPage() {
  const { currentUser } = useAuth();
  const { posts, addPost, updatePost, deletePost } = useSocialMedia();
  const { campaigns } = useMarketing();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const campaignMap = useMemo(() => {
    const m = new Map<string, string>();
    campaigns.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [campaigns]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (post: SocialPost) => {
    setEditingId(post.id);
    setForm({
      platform: post.platform,
      title: post.title,
      status: post.status,
      scheduledDate: post.scheduledDate ?? "",
      linkedCampaignId: post.linkedCampaignId ?? "",
      notes: post.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (editingId) {
      const approvedBy = form.status === "approved" ? currentUser?.name : undefined;
      const approvedAt = form.status === "approved" ? new Date().toISOString().slice(0, 10) : undefined;
      updatePost(editingId, {
        platform: form.platform,
        title: form.title.trim(),
        status: form.status,
        scheduledDate: form.scheduledDate || undefined,
        linkedCampaignId: form.linkedCampaignId || undefined,
        notes: form.notes.trim() || undefined,
        approvedBy,
        approvedAt,
      });
      toast({ title: "Post updated" });
    } else {
      const approvedBy = form.status === "approved" ? currentUser?.name : undefined;
      const approvedAt = form.status === "approved" ? new Date().toISOString().slice(0, 10) : undefined;
      addPost({
        platform: form.platform,
        title: form.title.trim(),
        status: form.status,
        scheduledDate: form.scheduledDate || undefined,
        linkedCampaignId: form.linkedCampaignId || undefined,
        notes: form.notes.trim() || undefined,
        approvedBy,
        approvedAt,
      });
      toast({ title: "Post added" });
    }
    setForm(emptyForm);
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deletePost(deleteId);
      toast({ title: "Post removed" });
      setDeleteId(null);
    }
  };

  const sorted = useMemo(
    () => [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [posts]
  );

  const calendarDays = useMemo(() => {
    const byDate = new Map<string, SocialPost[]>();
    posts.forEach((p) => {
      const d = p.scheduledDate ?? p.publishedDate ?? p.createdAt.slice(0, 10);
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(p);
    });
    const dates = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    return dates;
  }, [posts]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6" /> Content & posts
          </h1>
          <p className="text-muted-foreground">
            Add and manage social media content. Link to campaigns, submit for review, and schedule.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add post
        </Button>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <TableIcon className="w-4 h-4" /> Table
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="w-4 h-4" /> Calendar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled / Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No posts yet. Click &quot;Add post&quot; to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.platform}</TableCell>
                      <TableCell>
                        {p.linkedCampaignId ? (
                          <Link
                            to="/marketing/campaigns"
                            className="text-primary hover:underline text-sm"
                          >
                            {campaignMap.get(p.linkedCampaignId) ?? p.linkedCampaignId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[p.status]}>{p.status.replace("_", " ")}</Badge>
                        {p.approvedBy && (
                          <span className="ml-1 text-xs text-muted-foreground">by {p.approvedBy}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.status === "scheduled" && p.scheduledDate
                          ? p.scheduledDate
                          : p.status === "published" && p.publishedDate
                            ? p.publishedDate
                            : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(p.id)}
                            aria-label="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Posts by date (scheduled or published). Use the table view to edit or delete.
          </p>
          {calendarDays.length === 0 ? (
            <div className="rounded-md border py-12 text-center text-muted-foreground">
              No scheduled or published dates yet.
            </div>
          ) : (
            <div className="space-y-4">
              {calendarDays.map(([date, postList]) => (
                <Card key={date}>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{date}</p>
                    <ul className="space-y-2">
                      {postList.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 text-sm border-b border-muted/50 pb-2 last:border-0 last:pb-0"
                        >
                          <span className="font-medium">{p.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusVariant[p.status]} className="capitalize">
                              {p.status.replace("_", " ")}
                            </Badge>
                            <span className="text-muted-foreground">{p.platform}</span>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                              Edit
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Publishing</p>
              <p>
                Posts are tracked in this app only. To publish to Facebook or Instagram, use your
                usual tools or Meta Business Suite. One-click publishing from CWK Hub can be added
                once social accounts are connected via API.
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Meta Business Suite
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit post" : "Add post"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. STEM Fair announcement"
              />
            </div>
            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Campaign (optional)</Label>
              <Select
                value={form.linkedCampaignId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, linkedCampaignId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: SocialPost["status"]) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Scheduled date (optional)</Label>
              <Input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Save changes" : "Add post"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the post from the list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

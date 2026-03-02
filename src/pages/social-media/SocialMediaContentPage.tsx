import { useState } from "react";
import { useSocialMedia } from "@/context/SocialMediaContext";
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
import { Plus, Share2 } from "lucide-react";

const statusVariant: Record<SocialPost["status"], "default" | "secondary" | "outline"> = {
  draft: "secondary",
  scheduled: "outline",
  published: "default",
};

export default function SocialMediaContentPage() {
  const { posts, addPost } = useSocialMedia();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    platform: "Facebook",
    title: "",
    status: "draft" as SocialPost["status"],
    scheduledDate: "",
    notes: "",
  });

  const handleAdd = () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    addPost({
      platform: form.platform,
      title: form.title.trim(),
      status: form.status,
      scheduledDate: form.scheduledDate || undefined,
      notes: form.notes.trim() || undefined,
    });
    toast({ title: "Post added" });
    setForm({ platform: "Facebook", title: "", status: "draft", scheduledDate: "", notes: "" });
    setDialogOpen(false);
  };

  const sorted = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6" /> Content & posts
          </h1>
          <p className="text-muted-foreground">
            Add and manage social media content. Lead and Assistant can both manage this list.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add post
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled / Published</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No posts yet. Click &quot;Add post&quot; to add one.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.platform}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.status === "scheduled" && p.scheduledDate ? p.scheduledDate : p.status === "published" && p.publishedDate ? p.publishedDate : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{p.createdAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add post</DialogTitle>
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
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: SocialPost["status"]) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
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
            <Button onClick={handleAdd}>Add post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

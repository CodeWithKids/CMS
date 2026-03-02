import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { LearningTrack } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

const TRACK_OPTIONS: LearningTrack[] = ["game_design", "python", "robotics"];

export default function LDLessonPlansPage() {
  const [searchParams] = useSearchParams();
  const trackFromUrl = searchParams.get("track") as LearningTrack | null;
  const { templates } = useLessonPlans();
  const [trackFilter, setTrackFilter] = useState<string>(trackFromUrl ?? "all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = templates;
    if (trackFilter && trackFilter !== "all") list = list.filter((t) => t.learningTrackId === trackFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => (t.level?.toLowerCase().includes(q)) || (t.unit?.toLowerCase().includes(q)) || (t.title?.toLowerCase().includes(q)));
    }
    return list;
  }, [templates, trackFilter, search]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6" /> Lesson plan library
        </h1>
        <p className="text-muted-foreground">Master templates per track. L&D and Admin can edit.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Filter by track or search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="grid gap-2 w-48">
              <Label>Track</Label>
              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tracks</SelectItem>
                  {TRACK_OPTIONS.map((t) => <SelectItem key={t} value={t}>{LEARNING_TRACK_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-64">
              <Label>Search</Label>
              <Input placeholder="Level, unit, title..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Level / unit</TableHead>
                <TableHead>Week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No templates match.</TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{LEARNING_TRACK_LABELS[t.learningTrackId]}</TableCell>
                    <TableCell>{t.level ?? "—"} {t.unit ? ` / ${t.unit}` : ""}</TableCell>
                    <TableCell>{t.week ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useParams, Link } from "react-router-dom";
import { useCoachingNotes } from "@/features/ld-manager/context/CoachingNotesContext";
import { useAuth } from "@/context/AuthContext";
import { getEducatorName, getSessionsForTerm, getCurrentTerm } from "@/mockData";
import { canAddCoachingNotes } from "@/features/ld-manager/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function LDCoachingDetailPage() {
  const { educatorId } = useParams<{ educatorId: string }>();
  const id = educatorId ?? "";
  const { getNotesForEducator, addNote } = useCoachingNotes();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newText, setNewText] = useState("");
  const [newTrackRef, setNewTrackRef] = useState("");

  const notes = getNotesForEducator(id).sort((a, b) => b.date.localeCompare(a.date));
  const currentTerm = getCurrentTerm();
  const termId = currentTerm?.id ?? "t1";
  const sessions = getSessionsForTerm(termId).filter(
    (s) => s.leadEducatorId === id || (s.assistantEducatorIds ?? []).includes(id)
  );
  const canAdd = currentUser && canAddCoachingNotes(currentUser);

  const handleAddNote = () => {
    if (!newText.trim() || !currentUser) return;
    addNote({
      educatorId: id,
      authorId: currentUser.id,
      date: new Date().toISOString().slice(0, 10),
      text: newText.trim(),
      trackRef: newTrackRef.trim() || null,
      sessionId: null,
    });
    setNewText("");
    setNewTrackRef("");
    toast({ title: "Coaching note added" });
  };

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Missing educator.</p>
        <Button variant="link" asChild><Link to="/ld/coaching">Back to coaching</Link></Button>
      </div>
    );
  }

  const educatorName = getEducatorName(id);

  return (
    <div className="p-6 space-y-6">
      <Link to="/ld/coaching" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to educator coaching
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{educatorName}</h1>
        <p className="text-muted-foreground">Coaching notes and teaching summary</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This term</CardTitle>
            <CardDescription>Sessions and hours</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sessions.length}</p>
            <p className="text-sm text-muted-foreground">sessions</p>
            <p className="text-lg font-medium mt-2">{sessions.reduce((h, s) => h + (s.durationHours ?? 1), 0)} hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/session-reports">Session reports</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ld/lesson-plans">Lesson plan library</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coaching notes</CardTitle>
          <CardDescription>Timeline of L&D observations and feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canAdd && (
            <div className="rounded-lg border p-4 space-y-3">
              <Label>Add coaching note</Label>
              <Textarea value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="e.g. Observed Robotics L1: great engagement, needs clearer instructions at start." rows={3} />
              <Input value={newTrackRef} onChange={(e) => setNewTrackRef(e.target.value)} placeholder="Track / session ref (optional)" />
              <Button onClick={handleAddNote} disabled={!newText.trim()}>Add note</Button>
            </div>
          )}
          <ul className="space-y-3">
            {notes.length === 0 ? (
              <li className="text-sm text-muted-foreground">No coaching notes yet.</li>
            ) : (
              notes.map((n) => (
                <li key={n.id} className="border-l-2 pl-4 py-1">
                  <p className="text-sm font-medium text-muted-foreground">{n.date} {n.trackRef ? `· ${n.trackRef}` : ""}</p>
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-muted-foreground">By {getEducatorName(n.authorId)}</p>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

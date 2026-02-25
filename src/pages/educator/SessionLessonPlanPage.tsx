import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLessonPlans } from "@/context/LessonPlansContext";
import { getClass } from "@/mockData";
import { useSessions } from "@/context/SessionsContext";
import { LEARNING_TRACK_LABELS } from "@/types";
import { getSessionRoleForUser, canEditSession } from "@/features/educator/lib/auth";
import { SessionRoleChips } from "@/features/educator/components/SessionRoleChips";
import { AddCoachDialog } from "@/features/educator/components/AddCoachDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, BookOpen, Save, UserPlus, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { LessonPlanBlock } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function SessionLessonPlanPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getTemplatesForTrack, getInstanceForSession, createInstanceFromTemplate, updateInstance, setInstanceStatus } = useLessonPlans();
  const { toast } = useToast();
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [coachDialogOpen, setCoachDialogOpen] = useState(false);
  const { getSessionById } = useSessions();

  const session = getSessionById(sessionId ?? "");
  const cls = session ? getClass(session.classId) : null;
  const instance = sessionId ? getInstanceForSession(sessionId) : undefined;
  const templates = session ? getTemplatesForTrack(session.learningTrack) : [];
  const role = getSessionRoleForUser(session, currentUser);
  const canEdit = canEditSession(session, currentUser);

  const handleUseTemplate = (templateId: string) => {
    if (!sessionId) return;
    createInstanceFromTemplate(sessionId, templateId);
    setTemplatePickerOpen(false);
    toast({ title: "Lesson plan created", description: "You can now edit the plan. Save when ready." });
  };

  const handleSaveDraft = () => {
    if (!sessionId || !instance) return;
    toast({ title: "Draft saved", description: "Lesson plan saved." });
  };

  const handleMarkReady = () => {
    if (!sessionId) return;
    if (instance) setInstanceStatus(sessionId, "ready");
    else toast({ title: "No plan", description: "Select a template first." });
    toast({ title: "Marked ready", description: "Lesson plan is ready for this session." });
  };

  if (!session || !cls) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Session not found.</p>
        <Link to="/educator/dashboard" className="text-primary hover:underline text-sm">← Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/educator/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Lesson plan
          </CardTitle>
          <CardDescription>
            {cls.name} · {session.date} {session.startTime}–{session.endTime} · {LEARNING_TRACK_LABELS[session.learningTrack]}
            {role && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-muted">
                {role === "facilitator" ? "Facilitator" : "Coach"}
              </span>
            )}
          </CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SessionRoleChips session={session} />
            {canEdit && (
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCoachDialogOpen(true)}>
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Manage coaches
              </Button>
            )}
          </div>
          {session && (
            <AddCoachDialog session={session} open={coachDialogOpen} onOpenChange={setCoachDialogOpen} />
          )}
        </CardHeader>
      </Card>

      {!instance ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              No lesson plan for this session yet. Choose a template to get started.
            </p>
            {canEdit && (
              <Button onClick={() => setTemplatePickerOpen(true)}>
                <BookOpen className="w-4 h-4 mr-2" /> Choose template
              </Button>
            )}
            {role === "coach" && (
              <p className="text-sm text-muted-foreground mt-2">Only the facilitator can create or edit the lesson plan. You can view it once they have added one.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Session plan</CardTitle>
                <CardDescription>Status: {instance.status}</CardDescription>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                    <Save className="w-4 h-4 mr-2" /> Save draft
                  </Button>
                  {instance.status !== "ready" && (
                    <Button size="sm" onClick={handleMarkReady}>
                      Mark ready
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Lesson title</Label>
              <Input value={instance.lessonTitle} onChange={(e) => updateInstance(sessionId!, { lessonTitle: e.target.value })} disabled={!canEdit} className="mt-1" />
            </div>

            <Collapsible defaultOpen className="rounded-lg border p-4">
              <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                <ChevronDown className="w-4 h-4" /> Objectives & outcomes
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div>
                  <Label>Objectives</Label>
                  <Textarea value={instance.objectives.join("\n")} onChange={(e) => updateInstance(sessionId!, { objectives: e.target.value.split("\n").filter(Boolean) })} disabled={!canEdit} className="mt-1" rows={3} placeholder="One per line" />
                </div>
                <div>
                  <Label>Success criteria</Label>
                  <Textarea value={instance.successCriteria.join("\n")} onChange={(e) => updateInstance(sessionId!, { successCriteria: e.target.value.split("\n").filter(Boolean) })} disabled={!canEdit} className="mt-1" rows={2} placeholder="One per line" />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-lg border p-4">
              <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                <ChevronRight className="w-4 h-4" /> Prior knowledge
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div>
                  <Label>Prerequisites</Label>
                  <Textarea value={instance.prerequisites} onChange={(e) => updateInstance(sessionId!, { prerequisites: e.target.value })} disabled={!canEdit} className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Links to other sessions</Label>
                  <Textarea value={instance.linksToOtherSessions} onChange={(e) => updateInstance(sessionId!, { linksToOtherSessions: e.target.value })} disabled={!canEdit} className="mt-1" rows={1} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-lg border p-4">
              <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                <ChevronRight className="w-4 h-4" /> Materials & setup
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div>
                  <Label>Materials (one per line)</Label>
                  <Textarea value={instance.materials.join("\n")} onChange={(e) => updateInstance(sessionId!, { materials: e.target.value.split("\n").filter(Boolean) })} disabled={!canEdit} className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Devices (one per line)</Label>
                  <Textarea value={instance.devices.join("\n")} onChange={(e) => updateInstance(sessionId!, { devices: e.target.value.split("\n").filter(Boolean) })} disabled={!canEdit} className="mt-1" rows={1} />
                </div>
                <div>
                  <Label>Software (one per line)</Label>
                  <Textarea value={instance.software.join("\n")} onChange={(e) => updateInstance(sessionId!, { software: e.target.value.split("\n").filter(Boolean) })} disabled={!canEdit} className="mt-1" rows={1} />
                </div>
                <div>
                  <Label>Setup notes</Label>
                  <Textarea value={instance.setupNotes} onChange={(e) => updateInstance(sessionId!, { setupNotes: e.target.value })} disabled={!canEdit} className="mt-1" rows={2} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-lg border p-4">
              <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                <ChevronRight className="w-4 h-4" /> Lesson structure (blocks)
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {instance.blocks.map((block) => (
                  <div key={block.id} className="rounded border p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={block.type}
                        onValueChange={(v) => {
                          const next = instance.blocks.map((b) => (b.id === block.id ? { ...b, type: v as LessonPlanBlock["type"] } : b));
                          updateInstance(sessionId!, { blocks: next });
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warmup">Warmup</SelectItem>
                          <SelectItem value="main">Main</SelectItem>
                          <SelectItem value="wrapup">Wrap-up</SelectItem>
                        </SelectContent>
                      </Select>
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateInstance(sessionId!, { blocks: instance.blocks.filter((b) => b.id !== block.id) })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input value={block.title} onChange={(e) => { const next = instance.blocks.map((b) => (b.id === block.id ? { ...b, title: e.target.value } : b)); updateInstance(sessionId!, { blocks: next }); }} disabled={!canEdit} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea value={block.description} onChange={(e) => { const next = instance.blocks.map((b) => (b.id === block.id ? { ...b, description: e.target.value } : b)); updateInstance(sessionId!, { blocks: next }); }} disabled={!canEdit} className="mt-1" rows={2} />
                    </div>
                    <div className="flex gap-2">
                      <div>
                        <Label className="text-xs">Duration (min)</Label>
                        <Input type="number" min={1} value={block.durationMinutes} onChange={(e) => { const next = instance.blocks.map((b) => (b.id === block.id ? { ...b, durationMinutes: Number(e.target.value) || 0 } : b)); updateInstance(sessionId!, { blocks: next }); }} disabled={!canEdit} className="w-20 mt-1" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Grouping</Label>
                        <Input value={block.grouping ?? ""} onChange={(e) => { const next = instance.blocks.map((b) => (b.id === block.id ? { ...b, grouping: e.target.value || null } : b)); updateInstance(sessionId!, { blocks: next }); }} disabled={!canEdit} className="mt-1" placeholder="e.g. Pairs, whole class" />
                      </div>
                    </div>
                  </div>
                ))}
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => updateInstance(sessionId!, { blocks: [...instance.blocks, { id: `block-${Date.now()}`, type: "main", title: "", description: "", durationMinutes: 15, grouping: null }] })}>
                    <Plus className="w-4 h-4 mr-2" /> Add block
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-lg border p-4">
              <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                <ChevronRight className="w-4 h-4" /> Differentiation & extension
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div>
                  <Label>Support strategies</Label>
                  <Textarea value={instance.supportStrategies} onChange={(e) => updateInstance(sessionId!, { supportStrategies: e.target.value })} disabled={!canEdit} className="mt-1" rows={3} />
                </div>
                <div>
                  <Label>Extension ideas</Label>
                  <Textarea value={instance.extensionIdeas} onChange={(e) => updateInstance(sessionId!, { extensionIdeas: e.target.value })} disabled={!canEdit} className="mt-1" rows={2} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-lg border p-4">
              <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                <ChevronRight className="w-4 h-4" /> Assessment & evidence
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div>
                  <Label>Assessment methods</Label>
                  <Textarea value={instance.assessmentMethods} onChange={(e) => updateInstance(sessionId!, { assessmentMethods: e.target.value })} disabled={!canEdit} className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Evidence of learning</Label>
                  <Textarea value={instance.evidenceOfLearning} onChange={(e) => updateInstance(sessionId!, { evidenceOfLearning: e.target.value })} disabled={!canEdit} className="mt-1" rows={2} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="rounded-lg border p-4">
              <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                <ChevronRight className="w-4 h-4" /> Homework
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div>
                  <Label>Homework</Label>
                  <Textarea value={instance.homework} onChange={(e) => updateInstance(sessionId!, { homework: e.target.value })} disabled={!canEdit} className="mt-1" rows={2} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {role === "coach" && (
              <div>
                <Label>Coach notes (visible to admin/lead)</Label>
                <Textarea value={instance.coachNotes ?? ""} onChange={(e) => updateInstance(sessionId!, { coachNotes: e.target.value })} className="mt-1" rows={2} placeholder="Optional feedback or notes" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a template</DialogTitle>
            <DialogDescription>
              Templates for {LEARNING_TRACK_LABELS[session.learningTrack]}. Selecting one will create a copy for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.lessonTitle}</p>
                </div>
                <Button size="sm" onClick={() => handleUseTemplate(t.id)}>
                  Use this plan
                </Button>
              </div>
            ))}
          </div>
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">No templates for this track yet.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplatePickerOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

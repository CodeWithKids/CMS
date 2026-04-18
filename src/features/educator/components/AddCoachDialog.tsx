import { useState, useMemo } from "react";
import { useEducators } from "@/hooks/useEducators";
import { useSessions } from "@/context/SessionsContext";
import type { Session } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { X } from "lucide-react";

interface AddCoachDialogProps {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCoachDialog({ session, open, onOpenChange }: AddCoachDialogProps) {
  const { updateSession } = useSessions();
  const { educators: educatorUsers } = useEducators({ role: "educator" });
  const educatorNameById = useMemo(
    () => new Map(educatorUsers.map((educator) => [educator.id, educator.name])),
    [educatorUsers]
  );
  const [search, setSearch] = useState("");
  const [removeCoachId, setRemoveCoachId] = useState<string | null>(null);

  const coachIds = session.assistantEducatorIds ?? [];
  const facilitatorId = session.leadEducatorId;

  const availableToAdd = useMemo(() => {
    const already = new Set([facilitatorId, ...coachIds]);
    return educatorUsers.filter((u) => !already.has(u.id));
  }, [facilitatorId, coachIds]);

  const filteredToAdd = useMemo(() => {
    if (!search.trim()) return availableToAdd;
    const q = search.trim().toLowerCase();
    return availableToAdd.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)
    );
  }, [availableToAdd, search]);

  const handleAdd = (educatorId: string) => {
    const next = [...coachIds, educatorId];
    updateSession(session.id, { assistantEducatorIds: next });
  };

  const handleRemove = (educatorId: string) => {
    setRemoveCoachId(educatorId);
  };

  const confirmRemove = () => {
    if (!removeCoachId) return;
    const next = coachIds.filter((id) => id !== removeCoachId);
    updateSession(session.id, { assistantEducatorIds: next });
    setRemoveCoachId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage coaches</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Coaches can support this session and leave feedback. Only the facilitator can edit attendance and expenses.
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Current coaches</p>
              {coachIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">None added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {coachIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-sm"
                    >
                      {educatorNameById.get(id) ?? id}
                      <button
                        type="button"
                        aria-label={`Remove ${educatorNameById.get(id) ?? id} as coach`}
                        className="rounded p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(id)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Add coach</p>
              <Input
                placeholder="Search educators..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2"
              />
              <ul className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {filteredToAdd.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">
                    {availableToAdd.length === 0 ? "All educators are already assigned." : "No matches."}
                  </li>
                ) : (
                  filteredToAdd.map((u) => (
                    <li key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{u.name}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdd(u.id)}
                      >
                        Add
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeCoachId} onOpenChange={(o) => !o && setRemoveCoachId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove coach</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeCoachId ? (educatorNameById.get(removeCoachId) ?? removeCoachId) : ""} as coach for this session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

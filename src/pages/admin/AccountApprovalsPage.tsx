import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { mockUsers } from "@/mockData";
import { UserPlus, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AppUser } from "@/types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function AccountApprovalsPage() {
  const { toast } = useToast();
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<
    { user: AppUser; action: "approve" | "reject" } | null
  >(null);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);

  const pending = useMemo(
    () => mockUsers.filter((u) => u.status === "pending" && !processedIds.has(u.id)),
    [processedIds]
  );

  const handleApprove = (user: AppUser) => {
    setProcessedIds((prev) => new Set(prev).add(user.id));
    setConfirmAction(null);
    toast({
      title: "Account approved",
      description: `${user.name} has been approved and can now sign in.`,
    });
  };

  const handleReject = (user: AppUser) => {
    setProcessedIds((prev) => new Set(prev).add(user.id));
    setConfirmAction(null);
    toast({
      title: "Account rejected",
      description: `${user.name} has been rejected. They can be contacted to resolve any issues.`,
      variant: "default",
    });
  };

  const handleBulkApprove = () => {
    selectedIds.forEach((id) => setProcessedIds((prev) => new Set(prev).add(id)));
    const count = selectedIds.size;
    setSelectedIds(new Set());
    setBulkApproveOpen(false);
    toast({
      title: "Accounts approved",
      description: `${count} account${count === 1 ? "" : "s"} approved.`,
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pending.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pending.map((u) => u.id)));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account approvals</h1>
        <p className="text-muted-foreground">
          Approve or reject new accounts (students, parents, educators, finance). Create/edit/deactivate and assign roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Pending accounts
          </CardTitle>
          <CardDescription>
            Users awaiting approval. Approve or reject with confirmation; bulk approve available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No pending approvals.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedIds.size > 0 && setBulkApproveOpen(true)}
                  disabled={selectedIds.size === 0}
                >
                  <Check className="w-4 h-4" /> Approve selected ({selectedIds.size})
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={pending.length > 0 && selectedIds.size === pending.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-44">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                          aria-label={`Select ${user.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt ? formatDate(user.createdAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setConfirmAction({ user, action: "approve" })}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => setConfirmAction({ user, action: "reject" })}
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approve" ? "Approve account" : "Reject account"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "approve"
                ? `Approve ${confirmAction.user.name}? They will be able to sign in to CWK Hub.`
                : `Reject ${confirmAction.user.name}? They will not have access until the decision is reviewed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {confirmAction?.action === "approve" ? (
              <AlertDialogAction onClick={() => confirmAction && handleApprove(confirmAction.user)}>
                Approve
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => confirmAction && handleReject(confirmAction.user)}
              >
                Reject
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve selected accounts</AlertDialogTitle>
            <AlertDialogDescription>
              Approve {selectedIds.size} account{selectedIds.size === 1 ? "" : "s"}? They will be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkApprove}>Approve all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

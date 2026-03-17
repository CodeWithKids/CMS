import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockUsers } from "@/mockData";
import { UserPlus, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AppUser } from "@/types";
import {
  isApiEnabled,
  adminAccountsGetPending,
  adminAccountsPatch,
  adminPendingSignupsGet,
  adminPendingSignupApprove,
  adminPendingSignupReject,
  type AdminAccountUser,
  type PendingSignupApi,
} from "@/lib/api";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const PENDING_ACCOUNTS_QUERY_KEY = ["admin", "accounts", "pending"];
const PENDING_SIGNUPS_QUERY_KEY = ["admin", "pending-signups"];

export default function AccountApprovalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<
    { user: AppUser | AdminAccountUser; action: "approve" | "reject" } | null
  >(null);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [signupAction, setSignupAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [signupActionLoading, setSignupActionLoading] = useState(false);

  const apiEnabled = isApiEnabled();
  const { data: apiPending = [], isLoading, isError, error } = useQuery({
    queryKey: PENDING_ACCOUNTS_QUERY_KEY,
    queryFn: adminAccountsGetPending,
    enabled: apiEnabled,
  });

  const { data: pendingSignups = [], isLoading: signupsLoading } = useQuery({
    queryKey: PENDING_SIGNUPS_QUERY_KEY,
    queryFn: adminPendingSignupsGet,
    enabled: apiEnabled,
  });

  const mockPending = useMemo(
    () => mockUsers.filter((u) => u.status === "pending" && !processedIds.has(u.id)),
    [processedIds]
  );

  const pending: (AppUser | AdminAccountUser)[] = apiEnabled
    ? apiPending.filter((u) => !processedIds.has(u.id))
    : mockPending;

  const refetch = () => {
    if (apiEnabled) queryClient.invalidateQueries({ queryKey: PENDING_ACCOUNTS_QUERY_KEY });
  };

  const handleApprove = async (user: AppUser | AdminAccountUser) => {
    if (apiEnabled) {
      setActionLoading(true);
      try {
        await adminAccountsPatch(user.id, { status: "active" });
        setProcessedIds((prev) => new Set(prev).add(user.id));
        setConfirmAction(null);
        refetch();
        toast({
          title: "Account approved",
          description: `${user.name} has been approved and can now sign in.`,
        });
      } catch {
        toast({
          title: "Approval failed",
          description: "Could not approve this account. Try again.",
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
    } else {
      setProcessedIds((prev) => new Set(prev).add(user.id));
      setConfirmAction(null);
      toast({
        title: "Account approved",
        description: `${user.name} has been approved and can now sign in.`,
      });
    }
  };

  const handleReject = async (user: AppUser | AdminAccountUser) => {
    if (apiEnabled) {
      setActionLoading(true);
      try {
        await adminAccountsPatch(user.id, { status: "rejected" });
        setProcessedIds((prev) => new Set(prev).add(user.id));
        setConfirmAction(null);
        refetch();
        toast({
          title: "Account rejected",
          description: `${user.name} has been rejected. They can be contacted to resolve any issues.`,
        });
      } catch {
        toast({
          title: "Rejection failed",
          description: "Could not reject this account. Try again.",
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
    } else {
      setProcessedIds((prev) => new Set(prev).add(user.id));
      setConfirmAction(null);
      toast({
        title: "Account rejected",
        description: `${user.name} has been rejected. They can be contacted to resolve any issues.`,
      });
    }
  };

  const handleBulkApprove = async () => {
    if (apiEnabled) {
      setActionLoading(true);
      let done = 0;
      try {
        for (const id of selectedIds) {
          await adminAccountsPatch(id, { status: "active" });
          setProcessedIds((prev) => new Set(prev).add(id));
          done++;
        }
        const count = selectedIds.size;
        setSelectedIds(new Set());
        setBulkApproveOpen(false);
        refetch();
        toast({
          title: "Accounts approved",
          description: `${count} account${count === 1 ? "" : "s"} approved.`,
        });
      } catch {
        toast({
          title: "Bulk approve failed",
          description: `${done} of ${selectedIds.size} approved. Try again for the rest.`,
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
    } else {
      selectedIds.forEach((id) => setProcessedIds((prev) => new Set(prev).add(id)));
      const count = selectedIds.size;
      setSelectedIds(new Set());
      setBulkApproveOpen(false);
      toast({
        title: "Accounts approved",
        description: `${count} account${count === 1 ? "" : "s"} approved.`,
      });
    }
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

  const handleSignupApprove = async (id: string) => {
    setSignupActionLoading(true);
    try {
      await adminPendingSignupApprove(id);
      setSignupAction(null);
      queryClient.invalidateQueries({ queryKey: PENDING_SIGNUPS_QUERY_KEY });
      toast({
        title: "Signup approved",
        description: "Account has been created. They can now log in and are linked to sessions as applicable.",
      });
    } catch {
      toast({
        title: "Approval failed",
        description: "Could not approve this signup. Try again.",
        variant: "destructive",
      });
    } finally {
      setSignupActionLoading(false);
    }
  };

  const handleSignupReject = async (id: string) => {
    setSignupActionLoading(true);
    try {
      await adminPendingSignupReject(id);
      setSignupAction(null);
      queryClient.invalidateQueries({ queryKey: PENDING_SIGNUPS_QUERY_KEY });
      toast({
        title: "Signup rejected",
        description: "The signup request has been rejected.",
      });
    } catch {
      toast({
        title: "Rejection failed",
        description: "Could not reject this signup. Try again.",
        variant: "destructive",
      });
    } finally {
      setSignupActionLoading(false);
    }
  };

  const signupTypeLabel = (type: string) => {
    switch (type) {
      case "school":
        return "School";
      case "miradi":
        return "FCP (Miradi)";
      case "organisation":
        return "Organisation";
      case "parent":
        return "Parent";
      default:
        return type;
    }
  };

  const getSignupDisplay = (row: PendingSignupApi) => {
    const p = row.payload as Record<string, unknown>;
    if (row.signupType === "parent") {
      return { name: (p.name as string) ?? "—", email: (p.email as string) ?? "—", extra: (p.contactPhone as string) || null };
    }
    return {
      name: (p.organisationName as string) ?? "—",
      email: (p.contactEmail as string) ?? "—",
      extra: (p.contactPerson as string) || null,
    };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account approvals</h1>
          <p className="text-muted-foreground">
            Signup requests (school, organisation, FCP, parent) appear below—approve to add them to the database and link with sessions. Team members are created via Create team member.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/create-team-member">Create team member</Link>
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load pending accounts</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : "Something went wrong."}</AlertDescription>
        </Alert>
      )}

      {apiEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Pending signup requests</CardTitle>
            <CardDescription>
              School, organisation, FCP, and parent signups. Approve to create their account and add them to the database; they will be linked with sessions as applicable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {signupsLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading signup requests…</p>
            ) : pendingSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No pending signup requests.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name / Organisation</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-44">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSignups.map((row) => {
                    const display = getSignupDisplay(row);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Badge variant="secondary">{signupTypeLabel(row.signupType)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{display.name}</TableCell>
                        <TableCell>{display.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{display.extra ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.createdAt ? formatDate(row.createdAt) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              disabled={signupActionLoading}
                              onClick={() => setSignupAction({ id: row.id, action: "approve" })}
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive"
                              disabled={signupActionLoading}
                              onClick={() => setSignupAction({ id: row.id, action: "reject" })}
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Pending team accounts
          </CardTitle>
          <CardDescription>
            Team members (invited via Create team member) awaiting approval. Approve or reject with confirmation; bulk approve available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading pending accounts…</p>
          ) : pending.length === 0 ? (
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
                        {"createdAt" in user && user.createdAt ? formatDate(user.createdAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={actionLoading}
                            onClick={() => setConfirmAction({ user, action: "approve" })}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                            disabled={actionLoading}
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
        open={!!confirmAction?.user}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approve" ? "Approve account" : "Reject account"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.user
                ? confirmAction.action === "approve"
                  ? `Approve ${confirmAction.user.name}? They will be able to sign in to CWK Hub.`
                  : `Reject ${confirmAction.user.name}? They will not have access until the decision is reviewed.`
                : "Select an account to approve or reject."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {confirmAction?.action === "approve" ? (
              <AlertDialogAction
                disabled={actionLoading}
                onClick={() => confirmAction?.user && handleApprove(confirmAction.user)}
              >
                {actionLoading ? "Approving…" : "Approve"}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={actionLoading}
                onClick={() => confirmAction?.user && handleReject(confirmAction.user)}
              >
                {actionLoading ? "Rejecting…" : "Reject"}
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
            <AlertDialogAction disabled={actionLoading} onClick={handleBulkApprove}>
              {actionLoading ? "Approving…" : "Approve all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!signupAction} onOpenChange={(open) => !open && setSignupAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {signupAction?.action === "approve" ? "Approve signup" : "Reject signup"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {signupAction?.action === "approve"
                ? "Approve this signup? Their details will be added to the database and they will be able to log in and access their sessions."
                : "Reject this signup request? They will not be able to log in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {signupAction?.action === "approve" ? (
              <AlertDialogAction
                disabled={signupActionLoading}
                onClick={() => signupAction && handleSignupApprove(signupAction.id)}
              >
                {signupActionLoading ? "Approving…" : "Approve"}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={signupActionLoading}
                onClick={() => signupAction && handleSignupReject(signupAction.id)}
              >
                {signupActionLoading ? "Rejecting…" : "Reject"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

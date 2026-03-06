import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { useEducators } from "@/hooks/useEducators";
import { useAuth } from "@/context/AuthContext";
import { isApiEnabled, adminAccountsDelete } from "@/lib/api";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EducatorListItem } from "@/hooks/useEducators";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "secondary",
  rejected: "destructive",
};

export default function StaffDirectoryPage() {
  const { educators, isLoading } = useEducators();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<EducatorListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const apiEnabled = isApiEnabled();

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !apiEnabled) return;
    setDeleteLoading(true);
    try {
      await adminAccountsDelete(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["educators"] });
      toast({ title: "Account deleted", description: `${deleteTarget.name} has been removed.` });
      setDeleteTarget(null);
    } catch (e: unknown) {
      const message = e && typeof e === "object" && "body" in e && (e as { body?: { message?: string } }).body?.message;
      toast({ title: "Delete failed", description: message ?? "Could not delete account.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff directory</h1>
        <p className="text-muted-foreground">
          All educators and staff: contact info and status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Name, role, contact, and status. Click a name to open the profile; admins can edit and update staff from the profile page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading staff…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && apiEnabled && <TableHead className="w-[80px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {educators.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/admin/hr/staff/${staff.id}`}
                        className="text-primary hover:underline"
                      >
                        {staff.name}
                      </Link>
                      {isAdmin && apiEnabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                          asChild
                        >
                          <Link to={`/admin/hr/staff/${staff.id}`} title="Open profile to edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{staff.role}</TableCell>
                    <TableCell>
                      <span className="text-sm">{staff.email ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[staff.status ?? "active"] ?? "default"}>
                        {(staff.status ?? "active").replace("_", " ")}
                      </Badge>
                    </TableCell>
                    {isAdmin && apiEnabled && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={currentUser?.id === staff.id}
                          onClick={() => setDeleteTarget(staff)}
                          title={currentUser?.id === staff.id ? "You cannot delete your own account" : "Delete account"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget && (
              <>
                Permanently delete the account for <strong>{deleteTarget.name}</strong>? They will no longer be able to log in.
                This cannot be undone.
              </>
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

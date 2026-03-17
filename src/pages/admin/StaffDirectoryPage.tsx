import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { isApiEnabled, adminAccountsDelete, adminAccountsPatch } from "@/lib/api";
import { Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EducatorListItem } from "@/hooks/useEducators";

const STAFF_ROLES = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "educator", label: "Educator" },
  { value: "finance", label: "Finance" },
  { value: "partnerships", label: "Partnerships" },
  { value: "marketing", label: "Marketing" },
  { value: "social_media", label: "Social media" },
  { value: "ld_manager", label: "L&D Manager" },
  { value: "parent", label: "Parent" },
] as const;

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "secondary",
  rejected: "destructive",
};

export default function StaffDirectoryPage() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { educators, isLoading } = useEducators(
    roleFilter !== "all" ? { role: roleFilter } : undefined
  );
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<EducatorListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roleChangeId, setRoleChangeId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";
  const apiEnabled = isApiEnabled();

  const filteredEducators = useMemo(() => {
    if (!searchQuery.trim()) return educators;
    const q = searchQuery.trim().toLowerCase();
    return educators.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q)
    );
  }, [educators, searchQuery]);

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

  const handleRoleChange = async (staffId: string, newRole: string) => {
    if (!apiEnabled || !isAdmin || newRole === "all") return;
    setRoleChangeId(staffId);
    try {
      await adminAccountsPatch(staffId, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ["educators"] });
      queryClient.invalidateQueries({ queryKey: ["educator", staffId] });
      toast({ title: "Role updated", description: "Staff role has been changed." });
    } catch (e: unknown) {
      const message = e && typeof e === "object" && "body" in e && (e as { body?: { message?: string } }).body?.message;
      toast({ title: "Update failed", description: message ?? "Could not update role.", variant: "destructive" });
    } finally {
      setRoleChangeId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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
            Name, role, contact, and status. Click a name to open the profile; admins can change role here or in the profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading staff…</p>
          ) : filteredEducators.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              {educators.length === 0 ? "No staff found." : "No staff match your search or filter."}
            </p>
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
                {filteredEducators.map((staff) => (
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
                    <TableCell>
                      {isAdmin && apiEnabled ? (
                        <Select
                          value={staff.role}
                          onValueChange={(v) => handleRoleChange(staff.id, v)}
                          disabled={roleChangeId === staff.id || currentUser?.id === staff.id}
                        >
                          <SelectTrigger className="h-8 w-[140px] capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAFF_ROLES.filter((r) => r.value !== "all").map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="capitalize">{staff.role}</span>
                      )}
                    </TableCell>
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

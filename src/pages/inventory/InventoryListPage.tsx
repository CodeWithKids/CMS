import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useInventory } from "@/context/InventoryContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { getEducatorName } from "@/mockData";
import { INVENTORY_CATEGORY_LABELS, INVENTORY_STATUS_LABELS } from "@/types";
import type { InventoryCategory, InventoryStatus } from "@/types";
import { Package, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";

const ALL_CATEGORIES = "all";
const ALL_STATUSES = "all";

export default function InventoryListPage() {
  const { currentUser } = useAuth();
  const { items, deleteItem } = useInventory();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === "admin";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.assetTag?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchCategory =
        categoryFilter === ALL_CATEGORIES || item.category === categoryFilter;
      const matchStatus = statusFilter === ALL_STATUSES || item.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  function handleDelete(id: string) {
    deleteItem(id);
    setDeleteTarget(null);
    if (deleteTarget?.id === id) navigate("/inventory");
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage equipment and kits. Add, edit, or remove items."
              : "View equipment and kits. Contact admin to request changes."}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link to="/inventory/new">
              <Plus className="w-4 h-4" /> Add item
            </Link>
          </Button>
        )}
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load inventory.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setIsError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> Items
          </CardTitle>
          <CardDescription>Search and filter by category or status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search by name or asset tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {(Object.keys(INVENTORY_CATEGORY_LABELS) as InventoryCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {INVENTORY_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                {(Object.keys(INVENTORY_STATUS_LABELS) as InventoryStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {INVENTORY_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No items found</p>
              <p className="text-sm mt-1">
                {items.length === 0
                  ? "Add your first inventory item to get started."
                  : "No items match your filters. Try adjusting search or filters."}
              </p>
              {isAdmin && items.length === 0 && (
                <Button asChild className="mt-4">
                  <Link to="/inventory/new">
                    <Plus className="w-4 h-4" /> Add item
                  </Link>
                </Button>
              )}
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Asset tag</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="w-28">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/inventory/${item.id}`}
                      className="text-primary hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>{INVENTORY_CATEGORY_LABELS[item.category]}</TableCell>
                  <TableCell className="font-mono text-sm">{item.assetTag ?? "—"}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Badge
                        variant={
                          item.status === "available"
                            ? "default"
                            : item.status === "checked_out"
                              ? "secondary"
                              : item.status === "retired"
                                ? "destructive"
                                : "secondary"
                        }
                        className={
                          item.status === "checked_out"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : undefined
                        }
                      >
                        {INVENTORY_STATUS_LABELS[item.status]}
                      </Badge>
                      {item.status === "checked_out" &&
                        ((item.checkedOutByEducatorId ?? item.assignedEducatorId) || item.checkedOutAt || item.dueAt) && (
                        <p className="text-xs text-muted-foreground">
                          {(item.checkedOutByEducatorId ?? item.assignedEducatorId) &&
                            `Checked out by ${getEducatorName(item.checkedOutByEducatorId ?? item.assignedEducatorId!)}`}
                          {item.checkedOutAt && ` since ${new Date(item.checkedOutAt).toLocaleDateString("en-ZA")}`}
                          {item.dueAt && ` · Due ${new Date(item.dueAt).toLocaleDateString("en-ZA")}`}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/inventory/${item.id}/edit`} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{deleteTarget?.name}”? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

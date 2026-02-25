import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useInventory } from "@/context/InventoryContext";
import { getEducatorName } from "@/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INVENTORY_CATEGORY_LABELS, INVENTORY_STATUS_LABELS } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Pencil, LogIn, LogOut } from "lucide-react";
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

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getItem, canCheckout, canReturn, checkout, returnItem } = useInventory();
  const { toast } = useToast();
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const item = getItem(id ?? "");
  const isAdmin = currentUser?.role === "admin";
  const isEducator = currentUser?.role === "educator";
  const educatorId = currentUser?.id ?? "";
  const showCheckout = item && isEducator && canCheckout(item);
  const showReturn = item && isEducator && canReturn(item, educatorId);
  const checkedOutToName = item && (item.checkedOutByEducatorId ?? item.assignedEducatorId) ? getEducatorName(item.checkedOutByEducatorId ?? item.assignedEducatorId!) : null;
  const checkedOutAt = item?.checkedOutAt ?? null;

  const handleCheckout = () => {
    if (!id || !educatorId) return;
    checkout(id, educatorId);
    toast({ title: "Device checked out", description: "You have checked out this device." });
  };

  const handleReturn = () => {
    if (!id || !educatorId) return;
    returnItem(id, educatorId);
    setReturnConfirmOpen(false);
    toast({ title: "Device returned", description: "Device has been returned." });
  };

  if (!item) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Item not found.</p>
        <Link to="/inventory" className="text-primary hover:underline text-sm">
          ← Back to inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to inventory
        </Link>
        {isAdmin && (
          <Button asChild>
            <Link to={`/inventory/${item.id}/edit`}>
              <Pencil className="w-4 h-4" /> Edit
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> {item.name}
          </CardTitle>
          <CardDescription>
            {INVENTORY_CATEGORY_LABELS[item.category]}
            {item.assetTag ? ` · ${item.assetTag}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Category</dt>
              <dd>{INVENTORY_CATEGORY_LABELS[item.category]}</dd>
            </div>
            {item.assetTag != null && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Asset tag</dt>
                <dd className="font-mono">{item.assetTag}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Quantity</dt>
              <dd>{item.quantity}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd>
                {INVENTORY_STATUS_LABELS[item.status]}
                {(item.status === "checked_out" || item.status === "assigned") && checkedOutToName && (
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Checked out by {checkedOutToName}
                    {checkedOutAt && ` since ${new Date(checkedOutAt).toLocaleDateString("en-ZA")}`}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Location</dt>
              <dd>{item.location}</dd>
            </div>
            {item.purchaseDate && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Purchase date</dt>
                <dd>{item.purchaseDate}</dd>
              </div>
            )}
            {item.assignedEducatorId && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Assigned educator</dt>
                <dd>{getEducatorName(item.assignedEducatorId)}</dd>
              </div>
            )}
          </dl>
          {item.notes && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Notes</dt>
              <dd className="text-sm">{item.notes}</dd>
            </div>
          )}
          {showCheckout && (
            <div className="pt-4 border-t">
              <Button onClick={handleCheckout}>
                <LogIn className="w-4 h-4 mr-2" /> Check out
              </Button>
            </div>
          )}
          {showReturn && (
            <div className="pt-4 border-t">
              <Button variant="outline" onClick={() => setReturnConfirmOpen(true)}>
                <LogOut className="w-4 h-4 mr-2" /> Return
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={returnConfirmOpen} onOpenChange={setReturnConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return device</AlertDialogTitle>
            <AlertDialogDescription>
              Return this device and make it available to others?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn}>
              Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

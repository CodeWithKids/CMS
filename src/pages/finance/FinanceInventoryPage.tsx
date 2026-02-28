import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useInventory } from "@/context/InventoryContext";
import { getEducatorName } from "@/mockData";
import { INVENTORY_CATEGORY_LABELS, INVENTORY_STATUS_LABELS } from "@/types";
import type { InventoryCategory, InventoryStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";

export default function FinanceInventoryPage() {
  const { items } = useInventory();

  const summary = useMemo(() => {
    const byStatus = new Map<InventoryStatus, number>();
    const byCategory = new Map<InventoryCategory, number>();
    let checkedOutCount = 0;
    for (const item of items) {
      byStatus.set(item.status, (byStatus.get(item.status) ?? 0) + 1);
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
      if (item.status === "checked_out") checkedOutCount += 1;
    }
    return {
      total: items.length,
      checkedOutCount,
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
      byCategory: Array.from(byCategory.entries()).map(([category, count]) => ({ category, count })),
    };
  }, [items]);

  const checkedOutList = useMemo(
    () =>
      items
        .filter((i) => i.status === "checked_out")
        .map((i) => ({
          ...i,
          educatorName: (i.checkedOutByEducatorId ?? i.assignedEducatorId)
            ? getEducatorName(i.checkedOutByEducatorId ?? i.assignedEducatorId!)
            : "—",
        })),
    [items]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory summary</h1>
        <p className="text-muted-foreground">
          Devices and equipment at a glance. Read-only for finance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Checked out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.checkedOutCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              By status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm">
              {summary.byStatus.map(({ status, count }) => (
                <span key={status} className="rounded bg-muted px-2 py-0.5">
                  {INVENTORY_STATUS_LABELS[status]}: {count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> Devices currently checked out
          </CardTitle>
          <CardDescription>
            Name, type, who has it, and since when.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkedOutList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No devices currently checked out.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Who has it</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkedOutList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Link to={`/inventory/${item.id}`} className="text-primary hover:underline">
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>{INVENTORY_CATEGORY_LABELS[item.category]}</TableCell>
                    <TableCell>{item.educatorName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.checkedOutAt
                        ? new Date(item.checkedOutAt).toLocaleDateString("en-ZA")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

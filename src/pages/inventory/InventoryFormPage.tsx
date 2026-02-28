import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useInventory } from "@/context/InventoryContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVENTORY_CATEGORY_LABELS, INVENTORY_STATUS_LABELS } from "@/types";
import type { InventoryCategory, InventoryStatus } from "@/types";
import { mockUsers } from "@/mockData";
import { ArrowLeft } from "lucide-react";

const educatorOptions = mockUsers.filter((u) => u.role === "educator");

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required") as z.ZodType<InventoryCategory>,
  assetTag: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  status: z.string().min(1, "Status is required") as z.ZodType<InventoryStatus>,
  location: z.string().min(1, "Location is required"),
  purchaseDate: z.string().optional(),
  assignedEducatorId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function InventoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getItem, addItem, updateItem } = useInventory();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";
  const existing = isEdit ? getItem(id) : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existing?.name ?? "",
      category: existing?.category ?? "laptop",
      assetTag: existing?.assetTag ?? "",
      quantity: existing?.quantity ?? 1,
      status: existing?.status ?? "available",
      location: existing?.location ?? "",
      purchaseDate: existing?.purchaseDate ?? "",
      assignedEducatorId: existing?.assignedEducatorId ?? "",
      notes: existing?.notes ?? "",
    },
  });

  const isAdmin = currentUser?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Only admin can add or edit inventory.</p>
        <Link to="/inventory" className="text-primary hover:underline text-sm">
          ← Back to inventory
        </Link>
      </div>
    );
  }

  if (isEdit && !existing) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Item not found.</p>
        <Link to="/inventory" className="text-primary hover:underline text-sm">
          ← Back to inventory
        </Link>
      </div>
    );
  }

  function onSubmit(values: FormValues) {
    if (isEdit && existing) {
      updateItem(existing.id, {
        name: values.name,
        category: values.category,
        assetTag: values.assetTag || null,
        quantity: values.quantity,
        status: values.status,
        location: values.location,
        purchaseDate: values.purchaseDate || null,
        assignedEducatorId: values.assignedEducatorId || null,
        notes: values.notes || null,
      });
      navigate(`/inventory/${existing.id}`);
    } else {
      addItem({
        name: values.name,
        category: values.category,
        assetTag: values.assetTag || null,
        quantity: values.quantity,
        status: values.status,
        location: values.location,
        purchaseDate: values.purchaseDate || null,
        assignedEducatorId: values.assignedEducatorId || null,
        notes: values.notes || null,
      });
      navigate("/inventory");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Link
        to={isEdit && existing ? `/inventory/${existing.id}` : "/inventory"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit item" : "Add item"}</CardTitle>
          <CardDescription>
            {isEdit ? "Update inventory item details." : "Create a new inventory item."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Laptop – Dell 14&quot;" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(INVENTORY_CATEGORY_LABELS) as InventoryCategory[]).map(
                          (c) => (
                            <SelectItem key={c} value={c}>
                              {INVENTORY_CATEGORY_LABELS[c]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assetTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset tag / serial (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CWK-LAP-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(INVENTORY_STATUS_LABELS) as InventoryStatus[]).map(
                          (s) => (
                            <SelectItem key={s} value={s}>
                              {INVENTORY_STATUS_LABELS[s]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Office, School X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedEducatorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned educator (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select educator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {educatorOptions.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. Charger missing, used for Miradi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">{isEdit ? "Save changes" : "Add item"}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

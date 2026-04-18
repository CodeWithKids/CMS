import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { InventoryItem } from "@/types";
import { mockInventoryItems } from "@/mockData";
import { isApiEnabled, inventoryGetAll, inventoryCreate, inventoryUpdate, inventoryDelete } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

type InventoryItemInput = Omit<InventoryItem, "id"> & { id?: string };

interface InventoryContextType {
  items: InventoryItem[];
  getItem: (id: string) => InventoryItem | undefined;
  addItem: (item: InventoryItemInput) => void;
  updateItem: (id: string, update: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  /** Items currently checked out to this educator (status checked_out or assigned). */
  getItemsCheckedOutTo: (educatorId: string) => InventoryItem[];
  /** Check out item to educator. Sets status to checked_out and sets checkout fields. */
  checkout: (itemId: string, educatorId: string, dueAt?: string | null) => void;
  /** Return item (only if checked out to this educator). Clears checkout fields, sets status to available. */
  returnItem: (itemId: string, educatorId: string) => void;
  /** Whether the item can be checked out (available) or returned by this educator. */
  canCheckout: (item: InventoryItem) => boolean;
  canReturn: (item: InventoryItem, educatorId: string) => boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

type SupabaseInventoryRow = {
  id: string;
  name?: string | null;
  category?: string | null;
  status?: string | null;
  asset_tag?: string | null;
  assetTag?: string | null;
  quantity?: number | null;
  location?: string | null;
  purchase_date?: string | null;
  purchaseDate?: string | null;
  checked_out_by_educator_id?: string | null;
  checkedOutByEducatorId?: string | null;
  assigned_educator_id?: string | null;
  assignedEducatorId?: string | null;
  checked_out_at?: string | null;
  checkedOutAt?: string | null;
  due_at?: string | null;
  dueAt?: string | null;
  notes?: string | null;
  serialNumber?: string | null;
  purchasedAt?: string | null;
};

function mapSupabaseRowToInventoryItem(row: SupabaseInventoryRow): InventoryItem {
  return {
    id: row.id,
    name: row.name ?? "",
    category: (row.category ?? "other") as InventoryItem["category"],
    status: (row.status ?? "available") as InventoryItem["status"],
    assetTag: row.asset_tag ?? row.assetTag ?? row.serialNumber ?? null,
    quantity: Number(row.quantity ?? 1),
    location: row.location ?? "Main store",
    purchaseDate: row.purchase_date ?? row.purchaseDate ?? row.purchasedAt ?? null,
    checkedOutByEducatorId: row.checked_out_by_educator_id ?? row.checkedOutByEducatorId ?? null,
    assignedEducatorId: row.assigned_educator_id ?? row.assignedEducatorId ?? null,
    checkedOutAt: row.checked_out_at ?? row.checkedOutAt ?? null,
    dueAt: row.due_at ?? row.dueAt ?? null,
    notes: row.notes ?? null,
  };
}

function nextId(items: InventoryItem[]): string {
  const nums = items
    .map((i) => i.id.replace("inv", ""))
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `inv${max + 1}`;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(() => [...mockInventoryItems]);
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = !supabaseEnabled && isApiEnabled();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase.from("inventory_items").select("*");
          if (error) throw error;
          const mapped = ((data as SupabaseInventoryRow[] | null) ?? []).map(mapSupabaseRowToInventoryItem);
          if (!cancelled) setItems(mapped);
          return;
        } catch {
          if (!isApiEnabled()) return;
        }
      }

      if (apiEnabled || isApiEnabled()) {
        try {
          const list = await inventoryGetAll();
          if (cancelled) return;
          setItems(
            list.map((i) => ({
              id: i.id,
              name: i.name,
              category: i.category as InventoryItem["category"],
              status: i.status as InventoryItem["status"],
              assetTag: i.serialNumber ?? null,
              quantity: 1,
              location: "Main store",
              purchaseDate: i.purchasedAt ?? null,
              checkedOutByEducatorId: i.checkedOutByEducatorId ?? null,
              assignedEducatorId: i.assignedEducatorId ?? null,
              checkedOutAt: i.checkedOutAt ?? null,
              dueAt: i.dueAt ?? null,
              notes: i.notes ?? null,
            }))
          );
        } catch {
          // keep mock fallback if backend fails
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled, apiEnabled]);

  const getItem = useCallback(
    (id: string) => items.find((i) => i.id === id),
    [items]
  );

  const addItem = useCallback((input: InventoryItemInput) => {
    const id = input.id ?? nextId(items);
    const item: InventoryItem = { ...input, id };
    setItems((prev) => [item, ...prev]);
    if (supabaseEnabled && supabase) {
      void supabase.from("inventory_items").insert({
        id,
        name: item.name,
        category: item.category,
        status: item.status,
        asset_tag: item.assetTag ?? null,
        quantity: item.quantity,
        location: item.location,
        purchase_date: item.purchaseDate ?? null,
        checked_out_by_educator_id: item.checkedOutByEducatorId ?? null,
        assigned_educator_id: item.assignedEducatorId ?? null,
        checked_out_at: item.checkedOutAt ?? null,
        due_at: item.dueAt ?? null,
        notes: item.notes ?? null,
      });
      return;
    }
    if (apiEnabled) {
      inventoryCreate({
        id,
        name: input.name,
        category: input.category,
        status: input.status,
        serialNumber: input.assetTag,
        purchasedAt: input.purchaseDate,
        notes: input.notes,
      })
        .then((created) => {
          setItems((prev) =>
            prev.map((existing) =>
              existing.id === id
                ? {
                    ...existing,
                    id: created.id,
                    assetTag: created.serialNumber ?? existing.assetTag,
                    purchaseDate: created.purchasedAt ?? existing.purchaseDate,
                    checkedOutByEducatorId: created.checkedOutByEducatorId ?? existing.checkedOutByEducatorId,
                    assignedEducatorId: created.assignedEducatorId ?? existing.assignedEducatorId,
                    checkedOutAt: created.checkedOutAt ?? existing.checkedOutAt,
                    dueAt: created.dueAt ?? existing.dueAt,
                    notes: created.notes ?? existing.notes,
                  }
                : existing
            )
          );
        })
        .catch(() => {});
    }
  }, [apiEnabled, items, supabaseEnabled]);

  const updateItem = useCallback((id: string, update: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...update } : i))
    );
    if (supabaseEnabled && supabase) {
      void supabase
        .from("inventory_items")
        .update({
          name: update.name,
          category: update.category,
          status: update.status,
          asset_tag: update.assetTag ?? null,
          quantity: update.quantity,
          location: update.location,
          purchase_date: update.purchaseDate ?? null,
          checked_out_by_educator_id: update.checkedOutByEducatorId ?? null,
          assigned_educator_id: update.assignedEducatorId ?? null,
          checked_out_at: update.checkedOutAt ?? null,
          due_at: update.dueAt ?? null,
          notes: update.notes ?? null,
        })
        .eq("id", id);
      return;
    }
    if (apiEnabled) {
      inventoryUpdate(id, {
        name: update.name,
        category: update.category,
        status: update.status,
        serialNumber: update.assetTag ?? null,
        purchasedAt: update.purchaseDate ?? null,
        checkedOutByEducatorId: update.checkedOutByEducatorId ?? null,
        assignedEducatorId: update.assignedEducatorId ?? null,
        checkedOutAt: update.checkedOutAt ?? null,
        dueAt: update.dueAt ?? null,
        notes: update.notes ?? null,
      }).catch(() => {});
    }
  }, [apiEnabled, supabaseEnabled]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (supabaseEnabled && supabase) {
      void supabase.from("inventory_items").delete().eq("id", id);
      return;
    }
    if (apiEnabled) {
      inventoryDelete(id).catch(() => {});
    }
  }, [apiEnabled, supabaseEnabled]);

  const getItemsCheckedOutTo = useCallback(
    (educatorId: string) =>
      items.filter(
        (i) =>
          (i.status === "checked_out" && i.checkedOutByEducatorId === educatorId) ||
          (i.status === "assigned" && i.assignedEducatorId === educatorId)
      ),
    [items]
  );

  const checkout = useCallback((itemId: string, educatorId: string, dueAt?: string | null) => {
    const now = new Date().toISOString();
    updateItem(itemId, {
      status: "checked_out",
      checkedOutByEducatorId: educatorId,
      checkedOutAt: now,
      dueAt: dueAt ?? null,
      assignedEducatorId: educatorId,
    });
  }, [updateItem]);

  const returnItem = useCallback((itemId: string, educatorId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const outBy = item.checkedOutByEducatorId ?? item.assignedEducatorId;
    if (outBy !== educatorId) return;
    updateItem(itemId, {
      status: "available",
      checkedOutByEducatorId: null,
      checkedOutAt: null,
      dueAt: null,
      assignedEducatorId: null,
    });
  }, [items, updateItem]);

  const canCheckout = useCallback((item: InventoryItem) => item.status === "available", []);

  const canReturn = useCallback((item: InventoryItem, educatorId: string) => {
    const outBy = item.checkedOutByEducatorId ?? item.assignedEducatorId;
    return (item.status === "checked_out" || item.status === "assigned") && outBy === educatorId;
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        items,
        getItem,
        addItem,
        updateItem,
        deleteItem,
        getItemsCheckedOutTo,
        checkout,
        returnItem,
        canCheckout,
        canReturn,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { InventoryItem } from "@/types";
import { mockInventoryItems } from "@/mockData";

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

  const getItem = useCallback(
    (id: string) => items.find((i) => i.id === id),
    [items]
  );

  const addItem = useCallback((input: InventoryItemInput) => {
    setItems((prev) => {
      const id = input.id ?? nextId(prev);
      const item: InventoryItem = { ...input, id };
      return [item, ...prev];
    });
  }, []);

  const updateItem = useCallback((id: string, update: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...update } : i))
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

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
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId && (i.status === "available" || i.status === "assigned")
          ? {
              ...i,
              status: "checked_out" as const,
              checkedOutByEducatorId: educatorId,
              checkedOutAt: now,
              dueAt: dueAt ?? null,
              assignedEducatorId: educatorId,
            }
          : i
      )
    );
  }, []);

  const returnItem = useCallback((itemId: string, educatorId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const outBy = i.checkedOutByEducatorId ?? i.assignedEducatorId;
        if (outBy !== educatorId) return i;
        return {
          ...i,
          status: "available" as const,
          checkedOutByEducatorId: null,
          checkedOutAt: null,
          dueAt: null,
          assignedEducatorId: null,
        };
      })
    );
  }, []);

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

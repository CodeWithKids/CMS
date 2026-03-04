import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ReceivedDonation } from "../types";

interface ReceivedDonationsStoreType {
  donations: ReceivedDonation[];
  addDonation: (d: Omit<ReceivedDonation, "id" | "recordedAt"> & { recordedBy?: string }) => void;
  updateDonation: (id: string, patch: Partial<Omit<ReceivedDonation, "id">>) => void;
  getDonation: (id: string) => ReceivedDonation | undefined;
  getDonationsForYear: (year: number) => ReceivedDonation[];
}

const ReceivedDonationsContext = createContext<ReceivedDonationsStoreType | undefined>(undefined);

const currentYear = new Date().getFullYear();
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const INITIAL_DONATIONS: ReceivedDonation[] = [
  {
    id: "rd1",
    amountKes: 50_000,
    receivedDate: iso(currentYear, 1, 15),
    donorName: "Local Rotary Club",
    notes: "Community Donation Drive – Q1",
    recordedAt: new Date().toISOString(),
    recordedBy: "finance",
  },
  {
    id: "rd2",
    amountKes: 25_000,
    receivedDate: iso(currentYear, 2, 1),
    donorName: "Individual donor",
    recordedAt: new Date().toISOString(),
    recordedBy: "finance",
  },
];

function nextId(donations: ReceivedDonation[]): string {
  const nums = donations
    .map((d) => d.id.replace(/\D/g, ""))
    .filter((s) => s.length > 0)
    .map(Number);
  const max = nums.length ? Math.max(...nums) : 0;
  return `rd${max + 1}`;
}

export function ReceivedDonationsProvider({ children }: { children: ReactNode }) {
  const [donations, setDonations] = useState<ReceivedDonation[]>(INITIAL_DONATIONS);

  const addDonation = useCallback(
    (d: Omit<ReceivedDonation, "id" | "recordedAt"> & { recordedBy?: string }) => {
      const now = new Date().toISOString();
      setDonations((prev) => {
        const id = nextId(prev);
        return [...prev, { ...d, id, recordedAt: now }];
      });
    },
    []
  );

  const updateDonation = useCallback((id: string, patch: Partial<Omit<ReceivedDonation, "id">>) => {
    setDonations((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  }, []);

  const getDonation = useCallback(
    (id: string) => donations.find((d) => d.id === id),
    [donations]
  );

  const getDonationsForYear = useCallback(
    (year: number) =>
      donations.filter((d) => d.receivedDate.startsWith(String(year))),
    [donations]
  );

  const value = useMemo<ReceivedDonationsStoreType>(
    () => ({
      donations,
      addDonation,
      updateDonation,
      getDonation,
      getDonationsForYear,
    }),
    [donations, addDonation, updateDonation, getDonation, getDonationsForYear]
  );

  return (
    <ReceivedDonationsContext.Provider value={value}>
      {children}
    </ReceivedDonationsContext.Provider>
  );
}

export function useReceivedDonations() {
  const ctx = useContext(ReceivedDonationsContext);
  if (!ctx)
    throw new Error("useReceivedDonations must be used within ReceivedDonationsProvider");
  return ctx;
}

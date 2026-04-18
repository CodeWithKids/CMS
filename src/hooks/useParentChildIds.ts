import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLearners } from "@/hooks/useLearners";
import { parentChildMap } from "@/mockData";
import { isApiEnabled } from "@/lib/api";
import { isSupabaseEnabled } from "@/lib/supabaseClient";

function emailsMatch(a?: string | null, b?: string | null): boolean {
  const x = (a ?? "").trim().toLowerCase();
  const y = (b ?? "").trim().toLowerCase();
  return x.length > 0 && x === y;
}

/**
 * Learner ids the signed-in parent may act on (portal, invoices, events).
 * Prefers `parentUserId` on learner rows, then `parentEmail` vs profile email.
 * When neither backend is on, falls back to `parentChildMap` for demo accounts.
 */
export function useParentChildIds(): { childIds: string[] } {
  const { currentUser } = useAuth();
  const { learners } = useLearners();
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = isApiEnabled();

  const childIds = useMemo(() => {
    if (currentUser?.role !== "parent") return [];

    const uid = currentUser.id;
    const email = currentUser.email;

    const fromLearners = learners
      .filter((l) => {
        if (l.parentUserId != null && l.parentUserId === uid) return true;
        if (email != null && emailsMatch(l.parentEmail, email)) return true;
        return false;
      })
      .map((l) => l.id);

    const unique = [...new Set(fromLearners)];
    if (unique.length > 0) return unique;

    if (!supabaseEnabled && !apiEnabled) {
      return parentChildMap[uid] ?? [];
    }

    return [];
  }, [currentUser, learners, supabaseEnabled, apiEnabled]);

  return { childIds };
}

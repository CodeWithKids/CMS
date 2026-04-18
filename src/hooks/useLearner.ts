/**
 * Learner by ID from Supabase when configured, otherwise API, otherwise mock.
 * Use for display labels (e.g. in tables); render in a cell component so the hook is not called in a loop.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, learnersGetById, type LearnerApi } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";
import { mapSupabaseRowToLearnerApi, type SupabaseLearnerRow } from "@/lib/learnersSupabase";
import { getLearner } from "@/mockData";

const LEARNER_QUERY_KEY = ["learner"];

function learnerDisplayName(learner: LearnerApi | { firstName: string; lastName: string } | null): string {
  if (!learner) return "—";
  const first = learner.firstName?.trim() ?? "";
  const last = learner.lastName?.trim() ?? "";
  return [first, last].filter(Boolean).join(" ") || "—";
}

export function useLearner(id: string | null | undefined): {
  learner: LearnerApi | { id: string; firstName: string; lastName: string } | null;
  displayName: string;
  isLoading: boolean;
} {
  const supabaseEnabled = isSupabaseEnabled();
  const apiEnabled = isApiEnabled();
  const enabled = (supabaseEnabled || apiEnabled) && !!id;

  const query = useQuery({
    queryKey: [...LEARNER_QUERY_KEY, id ?? ""],
    queryFn: async () => {
      if (supabaseEnabled && supabase) {
        try {
          const { data, error } = await supabase.from("learners").select("*").eq("id", id!).maybeSingle();
          if (error) throw error;
          if (!data) return null;
          return mapSupabaseRowToLearnerApi(data as SupabaseLearnerRow);
        } catch {
          if (apiEnabled) return learnersGetById(id!);
          throw new Error("Could not load learner from Supabase.");
        }
      }
      return learnersGetById(id!);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
    if (!id) return { learner: null, displayName: "—", isLoading: false };
    const mock = getLearner(id);
    const learner = mock ? { id: mock.id, firstName: mock.firstName, lastName: mock.lastName } : null;
    return {
      learner,
      displayName: learnerDisplayName(learner),
      isLoading: false,
    };
  }

  const learner = query.data ?? null;
  return {
    learner,
    displayName: learnerDisplayName(learner),
    isLoading: query.isLoading,
  };
}

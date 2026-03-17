/**
 * Learner by ID from API when VITE_API_URL is set.
 * Use for display labels (e.g. in tables); render in a cell component so the hook is not called in a loop.
 */
import { useQuery } from "@tanstack/react-query";
import { isApiEnabled, learnersGetById, type LearnerApi } from "@/lib/api";
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
  const enabled = isApiEnabled() && !!id;

  const query = useQuery({
    queryKey: [...LEARNER_QUERY_KEY, id ?? ""],
    queryFn: () => learnersGetById(id!),
    enabled: !!enabled,
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

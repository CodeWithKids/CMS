/**
 * Cell components that display entity names by ID using by-id hooks.
 * Use these in table rows and lists instead of calling getLearner/getClass/getEducatorName in a loop
 * (which would break React's rules of hooks). See docs/MOCK_DATA_STRATEGY.md.
 */
import { useLearner } from "@/hooks/useLearner";
import { useClass } from "@/hooks/useClass";
import { useEducator } from "@/hooks/useEducator";

export function LearnerNameCell({
  learnerId,
  showIdAsFallback = true,
}: {
  learnerId: string | null | undefined;
  showIdAsFallback?: boolean;
}) {
  const { displayName, learner } = useLearner(learnerId);
  const fallback = showIdAsFallback && learnerId && displayName === "—" ? learnerId : displayName;
  return <span>{fallback}</span>;
}

export function ClassNameCell({
  classId,
  showIdAsFallback = true,
}: {
  classId: string | null | undefined;
  showIdAsFallback?: boolean;
}) {
  const { displayName, class: cls } = useClass(classId);
  const fallback = showIdAsFallback && classId && displayName === "—" ? classId : displayName;
  return <span>{fallback}</span>;
}

export function EducatorNameCell({
  educatorId,
  showIdAsFallback = true,
}: {
  educatorId: string | null | undefined;
  showIdAsFallback?: boolean;
}) {
  const { displayName, educator } = useEducator(educatorId);
  const fallback = showIdAsFallback && educatorId && displayName === "—" ? educatorId : displayName;
  return <span>{fallback}</span>;
}

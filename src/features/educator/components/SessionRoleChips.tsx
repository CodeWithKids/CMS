import { getEducatorName } from "@/mockData";
import type { Session } from "@/types";

interface SessionRoleChipsProps {
  session: Session | null;
}

export function SessionRoleChips({ session }: SessionRoleChipsProps) {
  if (!session) return null;

  const facilitatorName = getEducatorName(session.leadEducatorId);
  const coachIds = session.assistantEducatorIds ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium text-muted-foreground">Facilitator:</span>
      <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-medium">
        {facilitatorName}
      </span>
      {coachIds.length > 0 && (
        <>
          <span className="font-medium text-muted-foreground">Coach{coachIds.length > 1 ? "es" : ""}:</span>
          {coachIds.map((id) => (
            <span key={id} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {getEducatorName(id)}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

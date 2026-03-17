import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { useEventsList } from "@/features/events/api";
import { UpcomingEventsWithRegistration } from "@/features/events/components/UpcomingEventsWithRegistration";

export default function OrganisationEventsPage() {
  const { organisation, learners, isOrgUser } = useOrganisationLearners();
  const learnerIds = learners.map((l) => l.id);
  const { data: events = [] } = useEventsList({ upcomingOnly: true });
  const upcomingEvents = events;

  if (!isOrgUser || !organisation) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Organisation not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Upcoming events</h1>
      <p className="page-subtitle">
        View events and register your learners. You can add or remove registrations until the event closes.
      </p>

      <UpcomingEventsWithRegistration
        events={upcomingEvents}
        learnerIds={learnerIds}
        learnerListLabel="Your learners registered"
      />
    </div>
  );
}

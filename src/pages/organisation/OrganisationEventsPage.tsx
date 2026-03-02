import { useOrganisationLearners } from "@/hooks/useOrganisationLearners";
import { getUpcomingEvents } from "@/mockData";
import { UpcomingEventsWithRegistration } from "@/features/events/components/UpcomingEventsWithRegistration";

export default function OrganisationEventsPage() {
  const { organisation, learners, isOrgUser } = useOrganisationLearners();
  const learnerIds = learners.map((l) => l.id);
  const upcomingEvents = getUpcomingEvents();

  if (!isOrgUser || !organisation) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Organisation not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
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

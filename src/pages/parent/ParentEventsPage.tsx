import { useAuth } from "@/context/AuthContext";
import { parentChildMap, getUpcomingEvents } from "@/mockData";
import { UpcomingEventsWithRegistration } from "@/features/events/components/UpcomingEventsWithRegistration";

export default function ParentEventsPage() {
  const { currentUser } = useAuth();
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="page-container">
      <h1 className="page-title">Upcoming events</h1>
      <p className="page-subtitle">
        View events and register your children. You can add or remove registrations until the event closes.
      </p>

      <UpcomingEventsWithRegistration
        events={upcomingEvents}
        learnerIds={childIds}
        learnerListLabel="Your children registered"
      />
    </div>
  );
}

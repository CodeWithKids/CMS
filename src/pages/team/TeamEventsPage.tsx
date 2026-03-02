import { getUpcomingEvents } from "@/mockData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "lucide-react";

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function TeamEventsPage() {
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="page-container p-6">
      <h1 className="page-title">Upcoming events</h1>
      <p className="page-subtitle">
        CWK events and key dates. Parents and organisations can register learners from their portals.
      </p>

      {upcomingEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No upcoming events at the moment. Check back later.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg">{event.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.date)} at {event.time}
                    </p>
                  </div>
                </div>
              </CardHeader>
              {event.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

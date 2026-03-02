import { useState } from "react";
import type { EventEntity } from "@/types";
import { getLearner } from "@/mockData";
import { useEventRegistrations } from "@/context/EventRegistrationsContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export interface UpcomingEventsWithRegistrationProps {
  events: EventEntity[];
  /** Learners the current user can register (e.g. parent's children or org's learners). */
  learnerIds: string[];
  /** Optional label for the learner list, e.g. "Your children" or "Your learners". */
  learnerListLabel?: string;
}

export function UpcomingEventsWithRegistration({
  events,
  learnerIds,
  learnerListLabel = "Learners",
}: UpcomingEventsWithRegistrationProps) {
  const { toast } = useToast();
  const {
    getRegisteredLearnerIds,
    isLearnerRegistered,
    registerLearner,
    unregisterLearner,
  } = useEventRegistrations();
  const [registeringFor, setRegisteringFor] = useState<{ eventId: string; learnerId: string } | null>(null);

  const handleRegister = (eventId: string, learnerId: string) => {
    if (isLearnerRegistered(eventId, learnerId)) return;
    registerLearner(eventId, learnerId);
    setRegisteringFor(null);
    const learner = getLearner(learnerId);
    const event = events.find((e) => e.id === eventId);
    toast({
      title: "Registered",
      description: learner && event
        ? `${learner.firstName} ${learner.lastName} registered for ${event.title}.`
        : "Registration saved.",
    });
  };

  const handleUnregister = (eventId: string, learnerId: string) => {
    unregisterLearner(eventId, learnerId);
    const learner = getLearner(learnerId);
    const event = events.find((e) => e.id === eventId);
    toast({
      title: "Unregistered",
      description: learner && event
        ? `${learner.firstName} ${learner.lastName} removed from ${event.title}.`
        : "Registration removed.",
    });
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No upcoming events at the moment. Check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const registeredIds = getRegisteredLearnerIds(event.id);
        const availableLearners = learnerIds.filter((id) => getLearner(id));

        return (
          <Card key={event.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.date)} at {event.time}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description && (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {learnerListLabel} registered for this event
                </p>
                {registeredIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {registeredIds.map((lid) => {
                      const learner = getLearner(lid);
                      const canUnregister = learnerIds.includes(lid);
                      return (
                        <li
                          key={lid}
                          className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/50"
                        >
                          <span className="text-sm font-medium">
                            {learner ? `${learner.firstName} ${learner.lastName}` : lid}
                          </span>
                          {canUnregister && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleUnregister(event.id, lid)}
                            >
                              <UserMinus className="w-4 h-4 mr-1" /> Remove
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {availableLearners.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  {registeringFor?.eventId === event.id ? (
                    <>
                      <Select
                        value={registeringFor.learnerId || undefined}
                        onValueChange={(learnerId) => {
                          if (learnerId) {
                            handleRegister(event.id, learnerId);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select learner" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLearners
                            .filter((id) => !isLearnerRegistered(event.id, id))
                            .map((id) => {
                              const l = getLearner(id);
                              return (
                                <SelectItem key={id} value={id}>
                                  {l ? `${l.firstName} ${l.lastName}` : id}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRegisteringFor(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRegisteringFor({ eventId: event.id, learnerId: "" })}
                      disabled={
                        availableLearners.every((id) => isLearnerRegistered(event.id, id))
                      }
                    >
                      <UserPlus className="w-4 h-4 mr-1" /> Register a learner
                    </Button>
                  )}
                </div>
              )}

              {learnerIds.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add learners to your account to register them for events.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

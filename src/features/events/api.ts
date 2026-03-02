import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toEventsCurrentUser } from "@/features/events/permissions";
import * as eventsApi from "@/mocks/eventsApi";
import type { ListEventsParams, CreateEventInput, UpdateEventInput, EventStatus } from "./types";

const QUERY_KEY_EVENTS = ["events"] as const;
const QUERY_KEY_EVENT_DETAIL = (slug: string) => ["events", "detail", slug] as const;

/** Params for list without currentUser (injected from auth). */
export type UseEventsListParams = Omit<ListEventsParams, "currentUser">;

export function useEventsList(params?: UseEventsListParams) {
  const { currentUser } = useAuth();
  const eventsUser = toEventsCurrentUser(currentUser ?? null);

  return useQuery({
    queryKey: [...QUERY_KEY_EVENTS, params ?? {}, eventsUser?.userId, eventsUser?.role],
    queryFn: () => eventsApi.listEvents({ ...params, currentUser: eventsUser! }),
    enabled: !!eventsUser,
  });
}

export function useEventDetails(slug: string | undefined) {
  const { currentUser } = useAuth();
  const eventsUser = toEventsCurrentUser(currentUser ?? null);

  return useQuery({
    queryKey: [...QUERY_KEY_EVENT_DETAIL(slug ?? ""), eventsUser?.userId, eventsUser?.role],
    queryFn: () => eventsApi.getEventBySlug(slug!, eventsUser!),
    enabled: !!slug && !!eventsUser,
  });
}

export function useEventById(id: string | undefined) {
  const { currentUser } = useAuth();
  const eventsUser = toEventsCurrentUser(currentUser ?? null);

  return useQuery({
    queryKey: ["events", "byId", id ?? "", eventsUser?.userId],
    queryFn: () => eventsApi.getEventById(id!, eventsUser ?? undefined),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => eventsApi.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_EVENTS });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      eventsApi.updateEvent(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) =>
      eventsApi.updateEventStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_EVENTS });
    },
  });
}

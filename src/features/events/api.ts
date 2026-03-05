import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { toEventsCurrentUser } from "@/features/events/permissions";
import type { ListEventsParams, CreateEventInput, UpdateEventInput, EventStatus } from "./types";
import { isApiEnabled, eventsGetAll, eventsGetBySlug, eventsCreate, eventsUpdate } from "@/lib/api";

const QUERY_KEY_EVENTS = ["events"] as const;
const QUERY_KEY_EVENT_DETAIL = (slug: string) => ["events", "detail", slug] as const;

/** Params for list without currentUser (injected from auth). */
export type UseEventsListParams = Omit<ListEventsParams, "currentUser">;

export function useEventsList(params?: UseEventsListParams) {
  const { currentUser } = useAuth();
  const eventsUser = toEventsCurrentUser(currentUser ?? null);
  const apiEnabled = isApiEnabled();

  return useQuery({
    queryKey: [...QUERY_KEY_EVENTS, params ?? {}, eventsUser?.userId, eventsUser?.role],
    queryFn: () =>
      apiEnabled
        ? eventsGetAll({
            status: Array.isArray(params?.status) ? params?.status[0] : params?.status,
            dateFrom: params?.dateFrom,
            dateTo: params?.dateTo,
          })
        : Promise.resolve([]),
    enabled: !!eventsUser,
  });
}

export function useEventDetails(slug: string | undefined) {
  const { currentUser } = useAuth();
  const eventsUser = toEventsCurrentUser(currentUser ?? null);
  const apiEnabled = isApiEnabled();

  return useQuery({
    queryKey: [...QUERY_KEY_EVENT_DETAIL(slug ?? ""), eventsUser?.userId, eventsUser?.role],
    queryFn: () => (apiEnabled ? eventsGetBySlug(slug!) : Promise.resolve(null)),
    enabled: !!slug && !!eventsUser,
  });
}

export function useEventById(id: string | undefined) {
  const { currentUser } = useAuth();
  const eventsUser = toEventsCurrentUser(currentUser ?? null);
  const apiEnabled = isApiEnabled();

  return useQuery({
    queryKey: ["events", "byId", id ?? "", eventsUser?.userId],
    queryFn: () => (apiEnabled && id ? eventsGetBySlug(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => eventsCreate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_EVENTS });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      eventsUpdate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) =>
      eventsUpdate(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_EVENTS });
    },
  });
}

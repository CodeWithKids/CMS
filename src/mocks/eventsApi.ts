import type { Event, EventStatus, EventVisibility, CurrentUser, ListEventsParams, CreateEventInput, UpdateEventInput } from "@/features/events/types";
import { isInternalRole } from "@/features/events/permissions";

const TRACKS = ["Robotics", "AI", "Game Design", "3D Design"];

const now = new Date();
const nextMonth = new Date(now);
nextMonth.setMonth(nextMonth.getMonth() + 1);
const inTwoMonths = new Date(now);
inTwoMonths.setMonth(inTwoMonths.getMonth() + 2);

const toISO = (d: Date) => d.toISOString();

const defaultVisibility: EventVisibility = {
  allowedOrganisationIds: [],
  allowedSchoolIds: [],
  allowedMiradiIds: [],
  allowedParentIds: [],
};

function eventIsVisibleToUser(event: Event, user: CurrentUser): boolean {
  if (isInternalRole(user.role)) return true;
  const v = event.visibility;
  if (user.role === "ORG_REP" && user.organisationId) {
    return v.allowedOrganisationIds.includes(user.organisationId);
  }
  if (user.role === "SCHOOL_REP" && user.schoolId) {
    return v.allowedSchoolIds.includes(user.schoolId);
  }
  if (user.role === "MIRADI_REP" && user.miradiId) {
    return v.allowedMiradiIds.includes(user.miradiId);
  }
  if (user.role === "PARENT") {
    return v.allowedParentIds.includes(user.userId);
  }
  return false;
}

let events: Event[] = [
  {
    id: "ev1",
    slug: "robotics-workshop-march",
    title: "Robotics Workshop",
    description: "Hands-on robotics session for beginners. Build and program your first robot.",
    startDate: toISO(nextMonth),
    endDate: toISO(nextMonth),
    location: "Nairobi Makerspace",
    capacity: 30,
    price: 500,
    tracks: ["Robotics"],
    status: "PUBLISHED",
    registrationsCount: 12,
    visibility: { ...defaultVisibility, allowedSchoolIds: ["org1"], allowedOrganisationIds: ["org3"] },
  },
  {
    id: "ev2",
    slug: "game-design-jam",
    title: "Game Design Jam",
    description: "Design and prototype a simple game in one day. Scratch and basic game logic.",
    startDate: toISO(inTwoMonths),
    endDate: toISO(inTwoMonths),
    location: "Online",
    capacity: 25,
    price: null,
    tracks: ["Game Design"],
    status: "PUBLISHED",
    registrationsCount: 8,
    visibility: { ...defaultVisibility, allowedMiradiIds: ["org2"], allowedParentIds: ["u4"] },
  },
  {
    id: "ev3",
    slug: "ai-intro-session",
    title: "Introduction to AI",
    description: "What is AI? Explore machine learning basics with fun activities.",
    startDate: toISO(inTwoMonths),
    endDate: null,
    location: "Code With Kids Hub",
    capacity: 20,
    price: 0,
    tracks: ["AI"],
    status: "PUBLISHED",
    registrationsCount: 5,
    visibility: { ...defaultVisibility, allowedOrganisationIds: ["org3"], allowedSchoolIds: ["org1"] },
  },
  {
    id: "ev4",
    slug: "3d-design-basics",
    title: "3D Design Basics",
    description: "Learn Tinkercad and 3D printing basics.",
    startDate: toISO(inTwoMonths),
    endDate: null,
    location: "Nairobi Makerspace",
    capacity: 15,
    price: 750,
    tracks: ["3D Design"],
    status: "DRAFT",
    registrationsCount: 0,
    visibility: defaultVisibility,
  },
];

let nextId = 5;

function cloneEvent(e: Event): Event {
  return { ...e, visibility: { ...e.visibility } };
}

export async function listEvents(params: ListEventsParams): Promise<Event[]> {
  await Promise.resolve();
  let result = events.map(cloneEvent);

  if (params.currentUser && !isInternalRole(params.currentUser.role)) {
    result = result.filter((e) => eventIsVisibleToUser(e, params.currentUser!));
  }

  const statuses = params.status != null ? (Array.isArray(params.status) ? params.status : [params.status]) : null;
  if (statuses?.length) {
    result = result.filter((e) => statuses.includes(e.status));
  }
  if (params.upcomingOnly) {
    const today = new Date().toISOString().slice(0, 19);
    result = result.filter((e) => e.startDate >= today);
  }
  if (params.track) {
    result = result.filter((e) => e.tracks.includes(params.track!));
  }
  if (params.location) {
    const loc = params.location.toLowerCase();
    result = result.filter((e) => e.location.toLowerCase().includes(loc));
  }
  if (params.dateFrom) {
    result = result.filter((e) => e.startDate.slice(0, 10) >= params.dateFrom!);
  }
  if (params.dateTo) {
    result = result.filter((e) => e.startDate.slice(0, 10) <= params.dateTo!);
  }
  result.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return result;
}

export async function getEventBySlug(slug: string, currentUser: CurrentUser): Promise<Event | null> {
  await Promise.resolve();
  const e = events.find((x) => x.slug === slug);
  if (!e) return null;
  if (!eventIsVisibleToUser(e, currentUser)) return null;
  return cloneEvent(e);
}

export async function getEventById(id: string, currentUser?: CurrentUser | null): Promise<Event | null> {
  await Promise.resolve();
  const e = events.find((x) => x.id === id);
  if (!e) return null;
  if (currentUser && !eventIsVisibleToUser(e, currentUser)) return null;
  return cloneEvent(e);
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  await Promise.resolve();
  const id = `ev${nextId++}`;
  const event: Event = {
    id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    location: input.location,
    capacity: input.capacity ?? null,
    price: input.price ?? null,
    tracks: [...input.tracks],
    status: input.status,
    registrationsCount: 0,
    visibility: input.visibility ?? defaultVisibility,
  };
  events.push(event);
  return cloneEvent(event);
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
  await Promise.resolve();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found");
  const existing = events[idx];
  const visibility = input.visibility ?? existing.visibility;
  events[idx] = { ...existing, ...input, visibility };
  return cloneEvent(events[idx]);
}

export async function updateEventStatus(id: string, status: EventStatus): Promise<Event> {
  await Promise.resolve();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Event not found");
  events[idx] = { ...events[idx], status };
  return cloneEvent(events[idx]);
}

export { TRACKS };
export { eventIsVisibleToUser };

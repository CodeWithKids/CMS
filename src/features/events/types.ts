export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Tag-based visibility: only tagged entities can see the event (for external roles). */
export interface EventVisibility {
  allowedOrganisationIds: string[];
  allowedSchoolIds: string[];
  allowedMiradiIds: string[];
  allowedParentIds: string[];
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string; // ISO
  endDate?: string | null;
  location: string;
  capacity?: number | null;
  price?: number | null;
  tracks: string[];
  status: EventStatus;
  registrationsCount?: number;
  visibility: EventVisibility;
}

/** Events feature role (maps from app auth role). */
export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "MARKETING"
  | "STRATEGY"
  | "EDUCATOR"
  | "PARENT"
  | "ORG_REP"
  | "SCHOOL_REP"
  | "MIRADI_REP";

/** User context passed to events API for visibility filtering. */
export interface CurrentUser {
  userId: string;
  role: UserRole;
  organisationId?: string | null;
  schoolId?: string | null;
  miradiId?: string | null;
}

export interface ListEventsParams {
  status?: EventStatus | EventStatus[];
  upcomingOnly?: boolean;
  track?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  currentUser: CurrentUser;
}

export interface CreateEventInput {
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  location: string;
  capacity?: number | null;
  price?: number | null;
  tracks: string[];
  status: EventStatus;
  visibility: EventVisibility;
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, "slug">> & { slug?: string };

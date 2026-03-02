import type { AppUser } from "@/types";
import { getOrganization } from "@/mockData";
import type { CurrentUser, UserRole } from "./types";

const MANAGE_EVENTS_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "MARKETING", "STRATEGY"];
const VIEW_EVENTS_ROLES: UserRole[] = [
  ...MANAGE_EVENTS_ROLES,
  "EDUCATOR",
  "PARENT",
  "ORG_REP",
  "SCHOOL_REP",
  "MIRADI_REP",
];

const EXTERNAL_ROLES: UserRole[] = ["PARENT", "ORG_REP", "SCHOOL_REP", "MIRADI_REP"];
const INTERNAL_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "MARKETING", "STRATEGY", "EDUCATOR"];

export function canManageEvents(role: UserRole): boolean {
  return MANAGE_EVENTS_ROLES.includes(role);
}

export function canViewEvents(role: UserRole): boolean {
  return VIEW_EVENTS_ROLES.includes(role);
}

export function isExternalRole(role: UserRole): boolean {
  return EXTERNAL_ROLES.includes(role);
}

export function isInternalRole(role: UserRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

/** Map app auth role to events UserRole. */
export function toEventsRole(appRole: string | undefined): UserRole | null {
  if (!appRole) return null;
  const map: Record<string, UserRole> = {
    admin: "ADMIN",
    educator: "EDUCATOR",
    parent: "PARENT",
    organisation: "ORG_REP",
    marketing: "MARKETING",
    partnerships: "STRATEGY",
    ld_manager: "STRATEGY",
    finance: "ADMIN",
    social_media: "MARKETING",
    student: "PARENT",
  };
  return map[appRole] ?? null;
}

/** Build CurrentUser from app AuthContext user for events API. */
export function toEventsCurrentUser(appUser: AppUser | null): CurrentUser | null {
  if (!appUser) return null;
  const role = toEventsRole(appUser.role);
  if (!role) return null;

  const userId = appUser.id;
  const orgId = appUser.organizationId ?? null;

  if (appUser.role !== "organisation" || !orgId) {
    return {
      userId,
      role,
      organisationId: role === "PARENT" ? null : orgId ?? null,
      schoolId: null,
      miradiId: null,
    };
  }

  const org = getOrganization(orgId);
  const overviewType = org?.overviewType;
  const orgType = org?.type;

  if (overviewType === "SCHOOL" || orgType === "school") {
    return { userId, role: "SCHOOL_REP", schoolId: orgId, organisationId: null, miradiId: null };
  }
  if (overviewType === "MIRADI" || orgType === "church") {
    return { userId, role: "MIRADI_REP", miradiId: orgId, organisationId: null, schoolId: null };
  }
  return { userId, role: "ORG_REP", organisationId: orgId, schoolId: null, miradiId: null };
}

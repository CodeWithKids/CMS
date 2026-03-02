import type {
  AppUser,
  Learner,
  Organization,
  ClassEntity,
  Session,
  CoachingInvite,
  Invoice,
  Receipt,
  EventEntity,
  EventRegistration,
  StaffMember,
  Program,
  Term,
  Location,
  AgeGroup,
  IncomeSource,
  ExpenseCategory,
  EducatorPayment,
  Expense,
  EducatorSessionExpense,
  InventoryItem,
  SessionReport,
  AttendanceRecord,
  ClassEnrollment,
} from "@/types";

export {
  mockAvailabilitySlots,
  mockLessonPlanTemplates,
  mockLessonPlanInstances,
  mockEducatorBadges,
  getAvailabilitySlotsForEducator,
  getLessonPlanTemplatesForTrack,
  getLessonPlanInstanceForSession,
  getEducatorBadgesForEducator,
} from "./educator";

// Login mock: 7 team (admin, educator, finance, social_media, partnerships, ld_manager, marketing) + 5 other (school, organisation, parent, member learner, miradi)
export const mockUsers: AppUser[] = [
  { id: "u1", name: "Sarah Admin (Super admin)", role: "admin", email: "sarah@codewithkids.co.za", status: "active", createdAt: "2026-01-01" },
  { id: "u2", name: "Vivian Cheboi (Educator)", role: "educator", email: "vivian@codewithkids.co.za", status: "active", createdAt: "2026-01-01" },
  { id: "u3", name: "Lisa Finance (Finance)", role: "finance", email: "lisa@codewithkids.co.za", status: "active", createdAt: "2026-01-01" },
  { id: "u13", name: "Ivy Mwende (Social media)", role: "social_media", email: "ivy@codewithkids.co.za", status: "active", createdAt: "2026-01-01" },
  { id: "u11", name: "Tonny Ndare (Partnerships)", role: "partnerships", email: "tonny@codewithkids.co.za", status: "active", createdAt: "2026-01-01" },
  { id: "u16", name: "Renice Owino (L&D Manager)", role: "ld_manager", email: "renice.ld@codewithkids.co.za", status: "active", createdAt: "2026-01-01" },
  { id: "u12", name: "Serah Karimi (Marketing)", role: "marketing", email: "serah@codewithkids.co.za", status: "active", createdAt: "2026-01-01" },
  { id: "u4", name: "Patricia Wanja (Member learner)", role: "student", email: "patricia.wanja@mail.com", status: "active", createdAt: "2026-01-01", avatarId: "avatar-1" },
  { id: "u5", name: "Lucy Njeri (Parent)", role: "parent", email: "lucy.njeri@mail.com", status: "active", createdAt: "2026-01-01", membershipStatus: "active" },
  { id: "u10", name: "Greenfield Primary (School)", role: "organisation", email: "office@greenfield.edu", status: "active", createdAt: "2026-01-01", organizationId: "org1" },
  { id: "u9", name: "Spur Afrika (Organisation)", role: "organisation", email: "admin@spurafrika.org", status: "active", createdAt: "2026-01-01", organizationId: "org3" },
  { id: "u8", name: "Compassion Miradi (Miradi)", role: "organisation", email: "miradi@compassion.org", status: "active", createdAt: "2026-01-01", organizationId: "org2" },
];

export const mockOrganizations: Organization[] = [
  { id: "org1", name: "Greenfield Primary", type: "school", contactPerson: "Mr. Principal", contactPhone: "+27 11 100 1000", contactEmail: "office@greenfield.edu", location: "Johannesburg", status: "ACTIVE", overviewType: "SCHOOL" },
  { id: "org2", name: "Compassion Miradi", type: "church", contactPerson: "Pastor Sarah", contactPhone: "+27 11 200 2000", contactEmail: "miradi@compassion.org", location: "Nairobi", status: "ACTIVE", overviewType: "MIRADI" },
  { id: "org3", name: "Spur Afrika", type: "organisation", contactPerson: "Ms. Director", contactPhone: "+27 11 300 3000", contactEmail: "admin@spurafrika.org", location: "Cape Town", status: "ACTIVE", overviewType: "ORGANISATION" },
];

export const mockLearners: Learner[] = [
  { id: "l1", firstName: "Patricia", lastName: "Wanja", dateOfBirth: "2014-03-15", school: "Greenfield Primary", enrolmentType: "member", programType: "MAKERSPACE", membershipStatus: "active", userId: "u4", parentName: "Lucy Njeri", parentPhone: "+254 7XX XXX XXXX", parentEmail: "lucy.njeri@mail.com", status: "active", gender: "female", scratchProfileUrl: "https://scratch.mit.edu/users/patricia_coder/", typingProfileUrl: "https://www.typing.com/student/profile", joinedAt: "2026-01-15" },
  { id: "l2", firstName: "Maya", lastName: "Patel", dateOfBirth: "2013-07-22", school: "Riverside Academy", enrolmentType: "member", programType: "SCHOOL_CLUB", parentName: "Mr. Patel", parentPhone: "+27 83 234 5678", parentEmail: "patel@mail.com", status: "active", gender: "female", scratchProfileUrl: "https://scratch.mit.edu/users/maya_dev/", robloxProfileUrl: "https://www.roblox.com/users/123456789/profile", joinedAt: "2026-01-20" },
  { id: "l3", firstName: "Ethan", lastName: "Williams", dateOfBirth: "2012-11-08", school: "Oakwood School", enrolmentType: "member", programType: "SCHOOL_CLUB", parentName: "Mrs. Williams", parentPhone: "+27 84 345 6789", parentEmail: "williams@mail.com", status: "active", gender: "male", joinedAt: "2026-01-22" },
  { id: "l4", firstName: "Zara", lastName: "Nkosi", dateOfBirth: "2015-01-30", school: "Sunshine Primary", enrolmentType: "partner_org", programType: "ORGANISATION", organizationId: "org2", parentName: "Mrs. Nkosi", parentPhone: "", parentEmail: "", status: "active", gender: "female", joinedAt: "2026-01-10" },
  { id: "l5", firstName: "Liam", lastName: "Brown", dateOfBirth: "2011-09-12", school: "Greenfield Primary", enrolmentType: "member", programType: "MAKERSPACE", membershipStatus: "expired", userId: null, parentName: "Mr. Brown", parentPhone: "+27 86 567 8901", parentEmail: "brown@mail.com", status: "alumni", gender: "male", joinedAt: "2026-01-05" },
  { id: "l6", firstName: "Sofia", lastName: "Garcia", dateOfBirth: "2014-05-18", school: "Riverside Academy", enrolmentType: "partner_org", programType: "ORGANISATION", organizationId: "org3", status: "active", gender: "female", joinedAt: "2026-01-18" },
];

/** Canonical program names for classes (match SESSION_TYPE_LABELS). Daraja Tech falls under organisation sessions. */
export const PROGRAM_NAMES = [
  "Makerspace Session",
  "School STEM Club",
  "Virtual Session",
  "Home Sessions",
  "Organization Session",
  "Daraja Tech program",
  "Miradi Session (Compassion Churches)",
] as const;

export const mockClasses: ClassEntity[] = [
  { id: "c1", name: "Code With Kids - Makerspace", program: "Makerspace Session", ageGroup: "8-13", location: "Makerspace", educatorId: "u2", termId: "t1", learnerIds: ["l1", "l2", "l4"], capacity: 30 },
  { id: "c2", name: "Code With Kids - Virtual", program: "Virtual Session", ageGroup: "8-13", location: "Online", educatorId: "u2", termId: "t1", learnerIds: ["l3", "l5", "l6"], capacity: 25 },
  { id: "c3", name: "Code With Kids - Home Sessions", program: "Home Sessions", ageGroup: "8-13", location: "Home", educatorId: "u2", termId: "t1", learnerIds: ["l1", "l3", "l6"], capacity: 20 },
  { id: "c4", name: "Light International School", program: "School STEM Club", ageGroup: "8-13", location: "Light International School", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c5", name: "Kokomelon Schools", program: "School STEM Club", ageGroup: "8-13", location: "Kokomelon Schools", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c6", name: "Kianda School", program: "School STEM Club", ageGroup: "8-13", location: "Kianda School", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c7", name: "Vine Garden Academy", program: "School STEM Club", ageGroup: "8-13", location: "Vine Garden Academy", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c8", name: "KE 916 Kibera", program: "Miradi Session (Compassion Churches)", ageGroup: "8-13", location: "KE 916 Kibera", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c9", name: "KE 370 Waithaka", program: "Miradi Session (Compassion Churches)", ageGroup: "8-13", location: "KE 370 Waithaka", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c10", name: "KE 462 Limuru", program: "Miradi Session (Compassion Churches)", ageGroup: "8-13", location: "KE 462 Limuru", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c11", name: "Kangemi Church CDC", program: "Miradi Session (Compassion Churches)", ageGroup: "8-13", location: "Kangemi Church CDC", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c12", name: "Spur Afrika", program: "Organization Session", ageGroup: "8-13", location: "Spur Afrika", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c13", name: "Smart Kibera of Hope(SKOH)", program: "Organization Session", ageGroup: "8-13", location: "Smart Kibera of Hope", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
  { id: "c14", name: "Maisha Trust", program: "Organization Session", ageGroup: "8-13", location: "Maisha Trust", educatorId: "u2", termId: "t1", learnerIds: [], capacity: 30 },
];

const today = new Date().toISOString().split("T")[0];

export const mockSessions: Session[] = [
  { id: "s1", classId: "c1", date: today, startTime: "09:00", endTime: "10:00", topic: "Introduction to Loops", sessionType: "makerspace", duration: "1_hour", learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1 },
  { id: "s2", classId: "c2", date: today, startTime: "10:30", endTime: "11:30", topic: "Functions & Parameters", sessionType: "school_stem_club", duration: "1_hour", learningTrack: "python", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1 },
  { id: "s3", classId: "c1", date: "2026-01-22", startTime: "09:00", endTime: "10:00", topic: "Variables & Data Types", sessionType: "virtual", duration: "1_hour", learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1 },
  { id: "s4", classId: "c3", date: today, startTime: "14:00", endTime: "15:30", topic: "Building a Robot Arm", sessionType: "organization", duration: "2_hours", learningTrack: "robotics", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1.5 },
  { id: "s5", classId: "c2", date: "2026-03-02", startTime: "10:30", endTime: "11:30", topic: "Lists & Loops", sessionType: "home", duration: "1_hour", learningTrack: "python", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1 },
  { id: "s6", classId: "c1", date: "2026-03-03", startTime: "09:00", endTime: "10:00", topic: "Scratch Animation Project", sessionType: "miradi", duration: "2_hours", learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 2 },
  // Patricia Wanja (l1) – 3 sessions in Feb 2026 (Saturdays 7th, 14th, 28th)
  { id: "s7", classId: "c1", date: "2026-02-07", startTime: "09:00", endTime: "10:00", topic: "Loops and Patterns", sessionType: "makerspace", duration: "1_hour", learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1 },
  { id: "s8", classId: "c1", date: "2026-02-14", startTime: "09:00", endTime: "10:00", topic: "Sprites and Animation", sessionType: "makerspace", duration: "1_hour", learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1 },
  { id: "s9", classId: "c1", date: "2026-02-28", startTime: "09:00", endTime: "10:00", topic: "Project Build", sessionType: "makerspace", duration: "1_hour", learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [], durationHours: 1 },
];

/** Coaching/mentoring sessions scheduled by L&D Manager; educator must accept. */
export const mockCoachingInvites: CoachingInvite[] = [
  {
    id: "ci1",
    educatorId: "u2",
    createdById: "u16",
    date: "2026-02-15",
    startTime: "11:00",
    endTime: "12:00",
    title: "Scratch facilitation check-in",
    notes: "Review lesson delivery and classroom management.",
    status: "accepted",
    createdAt: "2026-02-10T09:00:00Z",
    respondedAt: "2026-02-11T14:00:00Z",
  },
];

/** In-memory attendance records (can start empty; app uses AttendanceContext for live state). */
export const mockAttendance: AttendanceRecord[] = [];

// Income and expenses: single source of truth from finance account (transparency & accuracy)
import { getFinanceAccountInvoices, getFinanceAccountExpenses } from "./financeAccount";
export { getFinanceAccountInvoices, getFinanceAccountExpenses } from "./financeAccount";
export const mockInvoices = getFinanceAccountInvoices();
export const mockExpenses = getFinanceAccountExpenses();

export const mockEvents: EventEntity[] = [
  { id: "e1", title: "STEM Fair 2026", date: "2026-03-15", time: "10:00", description: "Annual showcase of student projects", target: "students" },
  { id: "e2", title: "Parent Info Evening", date: "2026-03-20", time: "18:00", description: "Meet the educators and learn about our programs", target: "parents" },
  { id: "e3", title: "Coding Competition", date: "2026-04-05", time: "09:00", description: "Inter-school coding challenge", target: "students" },
  { id: "e4", title: "Coding Event", date: "2026-02-21", time: "10:00", description: "Coding Event – Patricia Wanja attended", target: "students" },
  { id: "e5", title: "Robotics Showcase", date: "2026-04-12", time: "14:00", description: "Demonstrations and hands-on robotics for learners", target: "students" },
  { id: "e6", title: "School Partners Day", date: "2026-04-18", time: "09:00", description: "Networking and programme updates for school partners", target: "parents" },
];

/** Event registrations (learner signed up for event). In production replace with API. */
export const mockEventRegistrations: EventRegistration[] = [
  { id: "er1", eventId: "e4", learnerId: "l1", registeredAt: "2026-02-01T10:00:00Z" },
];

/** Upcoming events: date >= today (ISO date string comparison). */
export function getUpcomingEvents(): EventEntity[] {
  const today = new Date().toISOString().slice(0, 10);
  return mockEvents.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

// Helper: get educator name by ID
export const getEducatorName = (educatorId: string): string => {
  const user = mockUsers.find((u) => u.id === educatorId);
  return user?.name ?? "Unknown";
};

// Helper: get learner by ID
export const getLearner = (id: string): Learner | undefined =>
  mockLearners.find((l) => l.id === id);

/** Get learner linked to an auth user (only MAKERSPACE learners have userId). */
export const getLearnerByUserId = (userId: string): Learner | undefined =>
  mockLearners.find((l) => l.userId === userId);

/**
 * Organisation-scoped learners: only those with learner.organizationId === organizationId.
 * Use this for all /organisation/* routes so org users never see other orgs' data.
 */
export const getOrganisationScopedLearners = (organizationId: string): Learner[] =>
  mockLearners.filter((l) => l.organizationId === organizationId);

/** @deprecated Use getOrganisationScopedLearners for org portal. */
export const getLearnersByOrganizationId = getOrganisationScopedLearners;

/**
 * Get a learner by id only if they belong to the given organisation.
 * Use for /organisation/learners/:id — returns undefined if learner doesn't exist or isn't linked to this org.
 */
export function getLearnerForOrganisation(
  learnerId: string,
  organizationId: string | null | undefined
): Learner | undefined {
  if (!learnerId || !organizationId) return undefined;
  const learner = mockLearners.find((l) => l.id === learnerId);
  return learner?.organizationId === organizationId ? learner : undefined;
}

/**
 * Normalize learner payload for create/update. Only MAKERSPACE learners can have userId and membershipStatus.
 * For SCHOOL_CLUB / ORGANISATION, userId and membershipStatus are forced to null.
 */
export function normalizeLearnerPayload<T extends Partial<Learner>>(payload: T): T {
  if (payload.programType !== "MAKERSPACE") {
    return { ...payload, userId: null, membershipStatus: null };
  }
  return payload;
}

// Helper: get organization by ID
export const getOrganization = (id: string): Organization | undefined =>
  mockOrganizations.find((o) => o.id === id);

// Helper: get class by ID
export const getClass = (id: string): ClassEntity | undefined =>
  mockClasses.find((c) => c.id === id);

// Helper: get learners for a class (enrolled learners; uses Class.learnerIds for backward compatibility)
export const getLearnersForClass = (classId: string): Learner[] => {
  const cls = mockClasses.find((c) => c.id === classId);
  if (!cls) return [];
  return cls.learnerIds.map((lid) => mockLearners.find((l) => l.id === lid)).filter((l): l is Learner => !!l);
};

// ——— Term-based enrolments ———
export const getTerm = (id: string): Term | undefined =>
  mockTerms.find((t) => t.id === id);

/** Current term: term whose start/end contains today; fallback to latest term. */
export function getCurrentTerm(): Term | undefined {
  const date = "2026-01-15"; // Mock reference: current term is Term 1 2026
  const current = mockTerms.find(
    (t) => t.startDate <= date && t.endDate >= date
  );
  if (current) return current;
  return mockTerms[mockTerms.length - 1];
}

/** Sessions in a given term. */
export function getSessionsForTerm(termId: string): Session[] {
  return mockSessions.filter((s) => s.termId === termId);
}

/** Enrollments for a class in a given term (all statuses). */
export const getEnrollmentsForClass = (classId: string, termId: string): ClassEnrollment[] =>
  mockClassEnrollments.filter((e) => e.classId === classId && e.termId === termId);

/** Learners enrolled in a class for a term (active status only). Uses provided enrollments so context can pass mutable list. */
export function getLearnersForClassAndTerm(
  classId: string,
  termId: string,
  learners: Learner[],
  enrollments: ClassEnrollment[]
): Learner[] {
  const activeIds = enrollments
    .filter((e) => e.classId === classId && e.termId === termId && e.status === "active")
    .map((e) => e.learnerId);
  return learners.filter((l) => activeIds.includes(l.id));
}

/** Enrollments for a learner across all classes/terms (for learner history). */
export const getEnrollmentsForLearner = (learnerId: string): ClassEnrollment[] =>
  mockClassEnrollments.filter((e) => e.learnerId === learnerId);

/** Active learner IDs for a class in a given term (status === "active"). Use for term-scoped attendance and lists. */
export const getActiveLearnerIdsForClassInTerm = (classId: string, termId: string): string[] =>
  getEnrollmentsForClass(classId, termId)
    .filter((e) => e.status === "active")
    .map((e) => e.learnerId);

/** Default term ID for "current" term (e.g. Term 1 2026). Callers can override with a selector. */
export const DEFAULT_TERM_ID = "t1";

// Helper: sessions for a class
export const getSessionsForClass = (classId: string): Session[] =>
  mockSessions.filter((s) => s.classId === classId);

// Helper: today's sessions for educator
export const getTodaySessionsForEducator = (educatorId: string): Session[] => {
  const educatorClasses = mockClasses.filter((c) => c.educatorId === educatorId);
  const classIds = educatorClasses.map((c) => c.id);
  return mockSessions.filter((s) => s.date === today && classIds.includes(s.classId));
};

/** Sessions where educator is facilitator (lead) or coach (assistant). */
export const getSessionsForEducatorByRole = (
  educatorId: string,
  opts: { date?: string; from?: string; to?: string; past?: boolean }
): Session[] => {
  let list = mockSessions.filter(
    (s) => s.leadEducatorId === educatorId || (s.assistantEducatorIds ?? []).includes(educatorId)
  );
  if (opts.date) list = list.filter((s) => s.date === opts.date);
  if (opts.from) list = list.filter((s) => s.date >= opts.from!);
  if (opts.to) list = list.filter((s) => s.date <= opts.to!);
  if (opts.past) {
    list = list.filter((s) => s.date < today).sort((a, b) => (b.date > a.date ? 1 : -1));
  } else if (opts.from ?? opts.to ?? opts.date) {
    list = [...list].sort((a, b) => a.date.localeCompare(b.date));
  }
  return list;
};

// Helper: past sessions for educator (date < today), most recent first
export const getPastSessionsForEducator = (educatorId: string): Session[] => {
  const educatorClasses = mockClasses.filter((c) => c.educatorId === educatorId);
  const classIds = educatorClasses.map((c) => c.id);
  return mockSessions
    .filter((s) => s.date < today && classIds.includes(s.classId))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
};

// Helper: today's sessions for a student
export const getTodaySessionsForStudent = (learnerId: string): Session[] => {
  const studentClasses = mockClasses.filter((c) => c.learnerIds.includes(learnerId));
  const classIds = studentClasses.map((c) => c.id);
  return mockSessions.filter((s) => s.date === today && classIds.includes(s.classId));
};

// Helper: all sessions for a student
export const getSessionsForStudent = (learnerId: string): Session[] => {
  const studentClasses = mockClasses.filter((c) => c.learnerIds.includes(learnerId));
  const classIds = studentClasses.map((c) => c.id);
  return mockSessions.filter((s) => classIds.includes(s.classId));
};

/** Invoices for a parent: only per-learner invoices (org-level school_club invoices are not shown to parents). */
export const getInvoicesForParent = (learnerIds: string[]): Invoice[] =>
  mockInvoices.filter((inv) => inv.learnerId != null && learnerIds.includes(inv.learnerId));

/** Invoices for an organisation (school, org, Miradi): only invoices billed to this organisation. */
export function getInvoicesForOrganisation(organizationId: string): Invoice[] {
  return getFinanceAccountInvoices().filter(
    (inv) => inv.organizationId != null && inv.organizationId === organizationId
  );
}

/** Receipt generated when invoice is paid. Returns null if invoice is not paid. */
export function getReceiptForInvoice(
  invoice: Invoice,
  payerLabel?: string | null
): Receipt | null {
  if (invoice.status !== "paid" || !invoice.paidDate) return null;
  const amountPaid = invoice.paidAmount ?? invoice.totalAmount;
  return {
    id: `receipt-${invoice.id}`,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    receiptNumber: `RCPT-${invoice.invoiceNumber}`,
    paidDate: invoice.paidDate,
    amountPaid,
    description: invoice.description ?? `${invoice.term} – ${invoice.source?.replace("_", " ") ?? "Invoice"}`,
    payerLabel: payerLabel ?? null,
    createdAt: invoice.paidDate,
  };
}

// Mock parent-child relationship
export const parentChildMap: Record<string, string[]> = {
  u5: ["l1"], // Lucy Njeri is Patricia Wanja's parent
};

// ——— HR: Staff (educators + admin + finance) ———
export const mockStaff: StaffMember[] = [
  {
    id: "u1",
    name: "Sarah Admin",
    email: "sarah@codewithkids.co.za",
    role: "admin",
    phone: "+27 81 111 1111",
    employmentStatus: "active",
    hireDate: "2026-01-01",
    contractType: "full_time",
    skills: ["Operations", "Admin"],
    notes: "Founder.",
    payType: "salary",
    baseRate: 35000,
    preferredPaymentMethod: "bank_transfer",
    documents: [{ id: "d1", name: "Contract 2026", type: "contract", uploadedAt: "2026-01-01" }],
    createdAt: "2026-01-01",
  },
  {
    id: "u2",
    name: "Vivian Cheboi",
    email: "vivian@codewithkids.co.za",
    role: "educator",
    phone: "+254 7XX XXX XXX",
    employmentStatus: "active",
    hireDate: "2026-01-01",
    contractType: "part_time",
    skills: ["Scratch", "Python", "Robotics"],
    notes: "Lead educator.",
    payType: "per_session",
    baseRate: 450,
    preferredPaymentMethod: "bank_transfer",
    documents: [
      { id: "d2", name: "Teaching cert", type: "certification", uploadedAt: "2026-01-01" },
    ],
    createdAt: "2026-01-01",
  },
  {
    id: "u3",
    name: "Lisa Finance",
    email: "lisa@codewithkids.co.za",
    role: "finance",
    phone: "+27 83 333 3333",
    employmentStatus: "active",
    hireDate: "2026-01-01",
    contractType: "part_time",
    skills: ["Bookkeeping", "Invoicing"],
    payType: "stipend",
    baseRate: 8000,
    preferredPaymentMethod: "bank_transfer",
    createdAt: "2026-01-01",
  },
  {
    id: "u11",
    name: "Tonny Ndare",
    email: "tonny@codewithkids.co.za",
    role: "admin",
    phone: "+254 7XX XXX XXX",
    employmentStatus: "active",
    hireDate: "2026-01-01",
    contractType: "full_time",
    skills: ["Partnerships", "Communications"],
    notes: "Partnership and Communications.",
    payType: "salary",
    baseRate: 0,
    preferredPaymentMethod: "bank_transfer",
    documents: [],
    createdAt: "2026-01-01",
  },
  {
    id: "u12",
    name: "Serah Karimi",
    email: "serah@codewithkids.co.za",
    role: "admin",
    phone: "+254 7XX XXX XXX",
    employmentStatus: "active",
    hireDate: "2026-01-01",
    contractType: "full_time",
    skills: ["Marketing", "Strategies"],
    notes: "Marketing and Strategies.",
    payType: "salary",
    baseRate: 0,
    preferredPaymentMethod: "bank_transfer",
    documents: [],
    createdAt: "2026-01-01",
  },
  {
    id: "u13",
    name: "Ivy Mwende",
    email: "ivy@codewithkids.co.za",
    role: "admin",
    phone: "+254 7XX XXX XXX",
    employmentStatus: "active",
    hireDate: "2026-01-01",
    contractType: "full_time",
    skills: ["Social Media", "Marketing"],
    notes: "Social Media Marketing (Lead).",
    payType: "salary",
    baseRate: 0,
    preferredPaymentMethod: "bank_transfer",
    documents: [],
    createdAt: "2026-01-01",
  },
  {
    id: "u16",
    name: "Renice Owino",
    email: "renice.ld@codewithkids.co.za",
    role: "ld_manager",
    phone: "+254 7XX XXX XXX",
    employmentStatus: "active",
    hireDate: "2026-01-01",
    contractType: "full_time",
    skills: ["Lesson plans", "Curriculum", "Facilitation"],
    notes: "Learning Development Manager. Lesson plans, curriculum development. Also facilitates sessions.",
    payType: "salary",
    baseRate: 0,
    preferredPaymentMethod: "bank_transfer",
    documents: [],
    createdAt: "2026-01-01",
  },
];

// ——— System setup ———
export const mockPrograms: Program[] = [
  { id: "prog1", name: "Coding Basics", description: "Intro to Scratch and block-based coding" },
  { id: "prog2", name: "Advanced Coding", description: "Python and text-based coding" },
  { id: "prog3", name: "Robotics", description: "Hands-on robotics and physical computing" },
];

export const mockTerms: Term[] = [
  { id: "t1", name: "Term 1 2026", year: 2026, startDate: "2026-01-08", endDate: "2026-03-31" },
  { id: "t2", name: "Term 2 2026", year: 2026, startDate: "2026-05-01", endDate: "2026-07-31" },
  { id: "t3", name: "Term 3 2026", year: 2026, startDate: "2026-08-15", endDate: "2026-09-26" },
];

/** Term-based enrolments. Who is in which class per term; status tracks active/dropped/completed for retention. */
export const mockClassEnrollments: ClassEnrollment[] = [
  // Term 1 2026: mirror current class.learnerIds
  { id: "ce1", classId: "c1", learnerId: "l1", termId: "t1", status: "active" },
  { id: "ce2", classId: "c1", learnerId: "l2", termId: "t1", status: "active" },
  { id: "ce3", classId: "c1", learnerId: "l4", termId: "t1", status: "active" },
  { id: "ce4", classId: "c2", learnerId: "l3", termId: "t1", status: "active" },
  { id: "ce5", classId: "c2", learnerId: "l5", termId: "t1", status: "active" },
  { id: "ce6", classId: "c2", learnerId: "l6", termId: "t1", status: "active" },
  { id: "ce7", classId: "c3", learnerId: "l1", termId: "t1", status: "active" },
  { id: "ce8", classId: "c3", learnerId: "l3", termId: "t1", status: "active" },
  { id: "ce9", classId: "c3", learnerId: "l6", termId: "t1", status: "active" },
  // Term 2 2026: l2 dropped from c1; l5 completed/dropped from c2; c3 same (retention example)
  { id: "ce10", classId: "c1", learnerId: "l1", termId: "t2", status: "active" },
  { id: "ce11", classId: "c1", learnerId: "l2", termId: "t2", status: "dropped" },
  { id: "ce12", classId: "c1", learnerId: "l4", termId: "t2", status: "active" },
  { id: "ce13", classId: "c2", learnerId: "l3", termId: "t2", status: "active" },
  { id: "ce14", classId: "c2", learnerId: "l5", termId: "t2", status: "completed" },
  { id: "ce15", classId: "c2", learnerId: "l6", termId: "t2", status: "active" },
  { id: "ce16", classId: "c3", learnerId: "l1", termId: "t2", status: "active" },
  { id: "ce17", classId: "c3", learnerId: "l3", termId: "t2", status: "active" },
  { id: "ce18", classId: "c3", learnerId: "l6", termId: "t2", status: "active" },
];

export const mockLocations: Location[] = [
  { id: "loc1", name: "Room A", address: "Main campus, Building 1" },
  { id: "loc2", name: "Room B", address: "Main campus, Building 1" },
  { id: "loc3", name: "Lab 1", address: "Tech block" },
  { id: "loc4", name: "Virtual", address: "Online" },
];

export const mockAgeGroups: AgeGroup[] = [
  { id: "ag1", name: "8-10", minAge: 8, maxAge: 10 },
  { id: "ag2", name: "10-12", minAge: 10, maxAge: 12 },
  { id: "ag3", name: "11-13", minAge: 11, maxAge: 13 },
];

export const mockIncomeSources: IncomeSource[] = [
  { id: "inc1", name: "School STEM Club", code: "STEM" },
  { id: "inc2", name: "Makerspace sessions", code: "MAKER" },
  { id: "inc3", name: "Home sessions", code: "HOME" },
  { id: "inc4", name: "Organization sessions", code: "ORG" },
  { id: "inc5", name: "Miradi (Compassion Churches)", code: "MIRADI" },
  { id: "inc6", name: "Camps", code: "CAMP" },
  { id: "inc7", name: "Donations", code: "DON" },
];

export const mockExpenseCategories: ExpenseCategory[] = [
  { id: "exp1", name: "Rent", code: "RENT" },
  { id: "exp2", name: "Internet", code: "NET" },
  { id: "exp3", name: "Utilities", code: "UTIL" },
  { id: "exp4", name: "Repairs", code: "REP" },
  { id: "exp5", name: "Equipment", code: "EQUIP" },
  { id: "exp6", name: "Travel", code: "TRAVEL" },
  { id: "exp7", name: "Marketing", code: "MKT" },
];

// ——— Finance module ———
export const mockEducatorPayments: EducatorPayment[] = [
  { id: "ep1", educatorId: "u2", period: "Term 1 2026", type: "stipend", amount: 5400, status: "paid", datePaid: "2026-01-31", notes: "Sessions Jan 2026" },
  { id: "ep2", educatorId: "u2", period: "2026-02", type: "stipend", amount: 5850, status: "pending", notes: "February sessions" },
  { id: "ep3", educatorId: "u3", period: "Term 1 2026", type: "stipend", amount: 8000, status: "paid", datePaid: "2026-01-31" },
  { id: "ep4", educatorId: "u2", period: "2026-01", type: "salary", amount: 3200, status: "paid", datePaid: "2026-01-31" },
  { id: "ep5", educatorId: "u2", period: "Term 1 2026", type: "bonus", amount: 500, status: "planned", notes: "Onboarding bonus (when approved)" },
];

/**
 * Payments for a single educator. Enforces educatorId filter.
 * Backend/API rule: when returning payments for the earnings page, always filter with
 * educatorId === currentUser.id and role === "educator". Never return all payments or
 * allow a different educatorId to be requested by an educator.
 */
export function getPaymentsForEducator(educatorId: string): EducatorPayment[] {
  return mockEducatorPayments.filter((p) => p.educatorId === educatorId);
}

export function getStaffMember(id: string): StaffMember | undefined {
  return mockStaff.find((s) => s.id === id);
}

// ——— Educator session expense requests ———
export const mockEducatorSessionExpenses: EducatorSessionExpense[] = [
  {
    id: "ese1",
    educatorId: "u2",
    sessionId: "s1",
    schoolName: "Greenfield Primary",
    transportTo: 120,
    transportFrom: 120,
    otherAmount: 0,
    totalRequested: 240,
    status: "requested",
    requestedAt: "2026-01-20T10:00:00.000Z",
    notes: "Taxi to and from school",
  },
  {
    id: "ese2",
    educatorId: "u2",
    sessionId: "s2",
    schoolName: "Riverside Academy",
    transportTo: 85,
    transportFrom: 85,
    totalRequested: 170,
    status: "issued",
    requestedAt: "2026-01-18T09:00:00.000Z",
    issuedAt: "2026-01-22T14:00:00.000Z",
    processedBy: "u3",
  },
  {
    id: "ese3",
    educatorId: "u2",
    sessionId: "s4",
    schoolName: "Ngong Road Hub",
    transportTo: 200,
    transportFrom: 200,
    otherAmount: 50,
    totalRequested: 450,
    status: "paid",
    requestedAt: "2026-01-15T08:00:00.000Z",
    issuedAt: "2026-01-17T11:00:00.000Z",
    paidAt: "2026-01-25T09:00:00.000Z",
    processedBy: "u3",
    notes: "Parking fee",
  },
  {
    id: "ese4",
    educatorId: "u2",
    sessionId: "s3",
    schoolName: "Greenfield Primary (virtual)",
    transportTo: 0,
    transportFrom: 0,
    totalRequested: 0,
    status: "requested",
    requestedAt: "2026-01-21T12:00:00.000Z",
    notes: "Virtual session – no transport",
  },
];

export function getSession(id: string): Session | undefined {
  return mockSessions.find((s) => s.id === id);
}

// ——— Inventory ———
export const mockInventoryItems: InventoryItem[] = [
  { id: "inv1", name: "Laptop – Dell 14\"", category: "laptop", assetTag: "CWK-LAP-001", quantity: 1, status: "available", location: "Makerspace", notes: "Primary teaching laptop" },
  { id: "inv2", name: "Laptop – Dell 14\"", category: "laptop", assetTag: "CWK-LAP-002", quantity: 1, status: "assigned", location: "Makerspace", assignedEducatorId: "u2" },
  { id: "inv3", name: "Arduino Kit #1", category: "robot", assetTag: "CWK-ARD-001", quantity: 1, status: "available", location: "Storage cabinet" },
  { id: "inv4", name: "Arduino Kit #2", category: "robot", assetTag: "CWK-ARD-002", quantity: 1, status: "under_maintenance", location: "Makerspace", notes: "Missing USB cable" },
  { id: "inv5", name: "Micro:bit kit set", category: "kit", assetTag: "CWK-MB-001", quantity: 10, status: "available", location: "Makerspace" },
  { id: "inv6", name: "Micro:bit kit set", category: "kit", assetTag: "CWK-MB-002", quantity: 8, status: "assigned", location: "Greenfield Primary", assignedEducatorId: "u2" },
  { id: "inv7", name: "USB-C cables", category: "other", assetTag: "CWK-CAB-001", quantity: 25, status: "available", location: "Storage cabinet", notes: "Various lengths" },
  { id: "inv8", name: "Projector – Epson", category: "projector", assetTag: "CWK-PRO-001", quantity: 1, status: "available", location: "Makerspace" },
  { id: "inv9", name: "Laptop – HP", category: "laptop", assetTag: "CWK-LAP-003", quantity: 1, status: "under_maintenance", location: "Makerspace", notes: "Screen crack; charger missing" },
  { id: "inv10", name: "Tablet – Samsung", category: "other", assetTag: "CWK-TAB-001", quantity: 1, status: "retired", location: "Home set", notes: "Reported missing Jan 2026" },
];

export function getInventoryItem(id: string): InventoryItem | undefined {
  return mockInventoryItems.find((i) => i.id === id);
}

// ——— Session reports ———
export const mockSessionReports: SessionReport[] = [
  {
    id: "sr1",
    sessionId: "s1",
    status: "submitted",
    leadEducatorId: "u2",
    assistantEducatorIds: [],
    date: today,
    duration: "1_hour",
    sessionType: "makerspace",
    durationHours: 1,
    schoolOrOrganizationName: "Scratch Explorers – Room A",
    totalLearners: 3,
    learningTrack: "game_design",
    femaleCount: 2,
    maleCount: 1,
    engagementLevel: 4,
    ranAsPlanned: true,
    technicalChallenges: false,
    highlights: ["Great participation", "Finished intro to loops"],
    objectivesMet: "yes",
    curriculumAdjustmentsSuggested: false,
    incidentOccurred: false,
    equipmentReturned: true,
    honestyConfirmed: true,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

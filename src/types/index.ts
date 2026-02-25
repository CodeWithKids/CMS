export type UserRole = "admin" | "educator" | "finance" | "student" | "parent" | "organisation";

export type UserStatus = "pending" | "active" | "rejected";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  status?: UserStatus;
  createdAt?: string; // ISO date string, for display
  /** For students: required preset avatar ID from approved gallery (no real photos). */
  avatarId?: string;
  /** For parents: must be "active" to log in; updated when membership is paid (Mpesa, Stripe, manual). */
  membershipStatus?: MembershipStatus;
  /** For organisation role: which Organisation this user belongs to (school/org portal). */
  organizationId?: string | null;
}

/** Preset avatar option for student profiles. No uploads; imageUrl + description for a11y. */
export interface PresetAvatar {
  id: string;
  imageUrl: string;
  description: string;
}

/** Member = direct parent contact; partner_org = school/org pays, learner tagged to organisation. */
export type LearnerEnrolmentType = "member" | "partner_org";

/** Programme context: only MAKERSPACE learners can have user accounts and paid membership. */
export type LearnerProgramType = "MAKERSPACE" | "SCHOOL_CLUB" | "ORGANISATION";

/** Membership status; only meaningful for MAKERSPACE (active = can log in). */
export type MembershipStatus = "active" | "inactive" | "expired";

export interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  school: string;
  /** Member: parent fields filled; partner_org: optional/minimal. */
  enrolmentType: LearnerEnrolmentType;
  /** Required. Only MAKERSPACE can have userId and membershipStatus. */
  programType: LearnerProgramType;
  /** Only for MAKERSPACE; must be "active" to log in. */
  membershipStatus?: MembershipStatus | null;
  /** FK to auth User; only set for MAKERSPACE learners with an account. */
  userId?: string | null;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  /** For partner_org: links to Organization (school, church, NGO, etc.). Optional for member (e.g. school for info). */
  organizationId?: string;
  status: "active" | "alumni";
  /** Optional for filters and reporting. */
  gender?: "male" | "female" | "other" | null;
  /** Learning platform profile URLs (e-portfolio). All optional. */
  scratchProfileUrl?: string | null;
  typingProfileUrl?: string | null;
  pygolfersProfileUrl?: string | null;
  robloxProfileUrl?: string | null;
  /** Aggregated badge counts by type (computed from LearnerBadgeAward, e.g. from backend). */
  badgesCountByType?: Partial<Record<BadgeType, number>>;
  /** Learning track; can be inferred from session reports if missing. */
  learningTrackId?: LearningTrack | null;
}

// ——— Admin learner profile (read-only view for GET /api/admin/learners/:id) ———
export type LearnerAdminProgramType = "MAKERSPACE" | "SCHOOL_CLUB" | "ORGANISATION";

export type LearnerAdminStatus = "ACTIVE" | "ALUMNI";

/** Enrolment row status for admin profile. */
export type LearnerAdminEnrolmentStatus = "CURRENT" | "COMPLETED" | "WITHDRAWN";

export interface LearnerAdminProfile {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | null;

  schoolName?: string | null;
  organisationName?: string | null;
  programType: LearnerAdminProgramType;
  status: LearnerAdminStatus;

  totalBadges: number;
  badgesByType: Record<string, number>;

  attendancePercentageCurrentTerm: number;
  presentCountCurrentTerm: number;
  absentCountCurrentTerm: number;
  lateCountCurrentTerm: number;
  recentAttendance: {
    sessionId: string;
    date: string;
    status: "present" | "absent" | "late";
    className: string;
  }[];

  enrolments: {
    termName: string;
    className: string;
    status: LearnerAdminEnrolmentStatus;
  }[];

  membershipStatus?: "active" | "inactive" | "expired" | null;
  parentName?: string | null;
}

// ——— Badges (educator-awarded from attendance) ———
export type BadgeType =
  | "PROBLEM_SOLVER"
  | "TEAM_PLAYER"
  | "LEADERSHIP"
  | "CREATIVITY"
  | "PERSISTENCE"
  | "KINDNESS"
  | "FOCUS_HERO"
  | "ATTENDANCE_STAR";

export interface BadgeDefinition {
  id: BadgeType;
  label: string;
  description: string;
  icon?: string;
}

export interface LearnerBadgeAward {
  id: string;
  learnerId: string;
  badgeId: BadgeType;
  sessionId?: string;
  awardedByEducatorId: string;
  awardedAt: string; // ISO
  note?: string | null;
}

/** School, church, NGO, company, etc. — used to tag partner learners and track billing/attendance per org. */
export type OrganizationType = "school" | "church" | "NGO" | "company" | "other";

/** Overview dashboard: group organisations as School / Organisation / Miradi. */
export type OrganisationOverviewType = "SCHOOL" | "ORGANISATION" | "MIRADI";

/** Organisation status for overview (active partners only). */
export type OrganisationStatus = "ACTIVE" | "INACTIVE";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  contactPerson: string;
  contactPhone?: string;
  contactEmail?: string;
  location: string;
  /** For admin overview: ACTIVE (default) or INACTIVE. */
  status?: OrganisationStatus;
  /** For admin overview: SCHOOL, ORGANISATION, or MIRADI. If not set, derived from type + name. */
  overviewType?: OrganisationOverviewType;
}

/** Admin overview dashboard: active partners and learners by track (GET /api/admin/overview shape). */
export interface AdminOverviewSummary {
  activeSchools: number;
  activeOrganisations: number;
  activeMiradis: number;
  partners: {
    organisationId: string;
    organisationName: string;
    type: OrganisationOverviewType;
    activeLearners: number;
  }[];
  learnersByTrack: {
    learningTrackId: LearningTrack;
    learningTrackName: string;
    learnerCount: number;
  }[];
}

/** Class: programme, location, educator. Each class belongs to a term; learner list is derived from ClassEnrollment. */
export interface ClassEntity {
  id: string;
  name: string;
  program: string;
  ageGroup: string;
  location: string;
  educatorId: string;
  /** Term this class runs in. Enrolments for this class + term live in ClassEnrollment. */
  termId: string;
  /** Legacy: all learner IDs ever on this class; prefer term-scoped enrollments for "who is in this term". */
  learnerIds: string[];
  /** Max learners for this class (for capacity indicator and over-capacity warnings). */
  capacity?: number;
}

/** Alias for prompt/API compatibility. */
export type Class = ClassEntity;

/** Enrolment status for a learner in a class for a given term. */
export type ClassEnrollmentStatus = "active" | "dropped" | "completed";

/** Alias for prompt/API compatibility. */
export type EnrollmentStatus = ClassEnrollmentStatus;

/** Term-based enrolment: who is in which class for which term. Enables retention (who returned) and term-scoped attendance/invoices. */
export interface ClassEnrollment {
  id: string;
  classId: string;
  learnerId: string;
  termId: string;
  status: ClassEnrollmentStatus;
}

export type SessionType =
  | "makerspace"
  | "school_stem_club"
  | "virtual"
  | "home"
  | "organization"
  | "miradi";

export type SessionDuration = "1_hour" | "2_hours" | "3_hours" | "4_hours" | "full_day";

export type LearningTrack =
  | "computer_basics"
  | "game_design"
  | "web_design"
  | "app_design"
  | "python"
  | "graphic_design"
  | "robotics"
  | "3d_design"
  | "microbit"
  | "physical_computing"
  | "science_experiments"
  | "financial_literacy"
  | "ai"
  | "blockchain"
  | "esports";

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  makerspace: "Makerspace Session",
  school_stem_club: "School STEM Club",
  virtual: "Virtual Session",
  home: "Home Sessions",
  organization: "Organization Session",
  miradi: "Miradi Session (Compassion Churches)",
};

export const SESSION_DURATION_LABELS: Record<SessionDuration, string> = {
  "1_hour": "1 hour",
  "2_hours": "2 hours",
  "3_hours": "3 hours",
  "4_hours": "4 hours",
  full_day: "Full day",
};

export const LEARNING_TRACK_LABELS: Record<LearningTrack, string> = {
  computer_basics: "Computer Basics",
  game_design: "Game Design (Scratch)",
  web_design: "Web Design",
  app_design: "App Design",
  python: "Python",
  graphic_design: "Graphic Design",
  robotics: "Robotics",
  "3d_design": "3D Design",
  microbit: "Micro:bit",
  physical_computing: "Physical Computing",
  science_experiments: "Science Experiments",
  financial_literacy: "Financial Literacy",
  ai: "Artificial Intelligence (AI)",
  blockchain: "BlockChain Technology",
  esports: "Esports",
};

export interface Session {
  id: string;
  classId: string;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  topic: string;
  sessionType: SessionType;
  duration: SessionDuration;
  learningTrack: LearningTrack;
  /** Term this session belongs to (or derive from class.termId). */
  termId: string;
  /** Educator who led the session. */
  leadEducatorId: string;
  /** Educators who assisted (coaching). */
  assistantEducatorIds: string[];
  /** Teaching duration in hours (e.g. 1, 1.5, 2) for hours aggregation. */
  durationHours: number;
}

/** Alias for spec: facilitator = lead educator, coaches = assistants. */
export type SessionFacilitatorId = Session["leadEducatorId"];
export type SessionCoachIds = Session["assistantEducatorIds"];

/** Educator weekly availability / schedule block (not a session). */
export type AvailabilitySlotType = "facilitating" | "coaching" | "unavailable" | "other";

export interface AvailabilitySlot {
  id: string;
  educatorId: string;
  /** 0 = Sunday, 1 = Monday, … 6 = Saturday; or store as "Mon"–"Sun" and derive. */
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;
  type: AvailabilitySlotType;
  classId?: string | null;
  location?: string | null;
  note?: string | null;
}

/** Lesson plan template (library) – filterable by learning track. */
export interface LessonPlanTemplate {
  id: string;
  learningTrackId: LearningTrack;
  unit?: string | null;
  week?: number | null;
  level?: string | null;
  /** Display title e.g. "Week 3 – Loops Challenge". */
  title: string;
  lessonTitle: string;
  objectives: string[];
  successCriteria: string[];
  prerequisites: string;
  linksToOtherSessions: string;
  devices: string[];
  software: string[];
  materials: string[];
  setupNotes: string;
  /** Timed blocks. */
  blocks: LessonPlanBlock[];
  supportStrategies: string;
  extensionIdeas: string;
  assessmentMethods: string;
  evidenceOfLearning: string;
  homework: string;
}

export interface LessonPlanBlock {
  id: string;
  type: "warmup" | "main" | "wrapup";
  title: string;
  description: string;
  durationMinutes: number;
  grouping?: string | null;
}

/** Per-session lesson plan instance (copy from template, editable). */
export type LessonPlanInstanceStatus = "not_started" | "draft" | "ready";

export interface LessonPlanInstance {
  id: string;
  sessionId: string;
  templateId: string | null;
  status: LessonPlanInstanceStatus;
  lessonTitle: string;
  objectives: string[];
  successCriteria: string[];
  prerequisites: string;
  linksToOtherSessions: string;
  devices: string[];
  software: string[];
  materials: string[];
  setupNotes: string;
  blocks: LessonPlanBlock[];
  supportStrategies: string;
  extensionIdeas: string;
  assessmentMethods: string;
  evidenceOfLearning: string;
  homework: string;
  /** Coach-only notes (visible to admin/lead). */
  coachNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Educator track mastery badge (e.g. Python Master, Robotics Master). */
export interface EducatorBadge {
  id: string;
  educatorId: string;
  trackId?: LearningTrack | null;
  name: string;
  description: string;
  earnedAt: string; // ISO date
}

export type InvoiceSource =
  | "school_club"
  | "makerspace"
  | "home_session"
  | "organization"
  | "miradi"
  | "camp"
  | "other"
  | "donation";

/** Income categorisation: session/programme type for reporting. */
export type IncomeSessionType =
  | "MAKERSPACE"
  | "SCHOOL_STEM_CLUB"
  | "VIRTUAL"
  | "HOME_SESSION"
  | "ORGANISATION_SESSION"
  | "MIRADI_SESSION"
  | "OTHER";

/** Who actually pays: used for income reports (Parent vs School vs Organisation). */
export type IncomePayerType = "PARENT" | "SCHOOL" | "ORGANISATION";

/** Who receives the invoice / who pays. School STEM Club and organisation sessions: invoice sent to school/org, they pay us (not the learner/parent). */
export type InvoicePayerType = "school" | "organization" | "learner";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  term: string;
  totalAmount: number;
  status: "draft" | "sent" | "partially_paid" | "paid";
  dueDate: string; // ISO date string
  source: InvoiceSource;
  paidAmount?: number; // for partially_paid: amount paid so far
  paidDate?: string; // ISO, when payment was received
  /**
   * When set: invoice is billed to this organisation (one invoice per school/org for school_club).
   * When null: invoice is per-learner (learnerId required). Income is recorded against org account when organizationId is set.
   */
  organizationId?: string | null;
  /** Required when organizationId is null (learner/parent invoice). Omit for org-level school_club/organisation invoices. */
  learnerId?: string | null;
  /** For org-level invoices: e.g. "School club term fee – 25 learners". */
  description?: string | null;
  /** For org-level invoices: number of learners covered (optional, for display). */
  learnerCount?: number | null;
  /** Income categorisation: session/programme type for finance reports. */
  sessionType?: IncomeSessionType | null;
  /** Income categorisation: who pays (PARENT / SCHOOL / ORGANISATION) for finance reports. */
  payerType?: IncomePayerType | null;
}

/** Source → who pays. School STEM Club and organisation: invoice to school/org; others are learner/parent fees. */
export function getInvoicePayerType(source: InvoiceSource): InvoicePayerType {
  if (source === "school_club") return "school";
  if (source === "organization") return "organization";
  return "learner";
}

/** Invoice source → IncomeSessionType for reporting. */
export function getIncomeSessionTypeFromSource(source: InvoiceSource): IncomeSessionType {
  const map: Record<InvoiceSource, IncomeSessionType> = {
    school_club: "SCHOOL_STEM_CLUB",
    makerspace: "MAKERSPACE",
    home_session: "HOME_SESSION",
    organization: "ORGANISATION_SESSION",
    miradi: "MIRADI_SESSION",
    camp: "OTHER",
    other: "OTHER",
    donation: "OTHER",
  };
  return map[source];
}

/** Invoice source → IncomePayerType (PARENT / SCHOOL / ORGANISATION). */
export function getIncomePayerTypeFromSource(source: InvoiceSource): IncomePayerType {
  if (source === "school_club") return "SCHOOL";
  if (source === "organization" || source === "miradi") return "ORGANISATION";
  return "PARENT";
}

export const INCOME_SESSION_TYPE_LABELS: Record<IncomeSessionType, string> = {
  MAKERSPACE: "Makerspace",
  SCHOOL_STEM_CLUB: "School STEM Club",
  VIRTUAL: "Virtual",
  HOME_SESSION: "Home session",
  ORGANISATION_SESSION: "Organisation session",
  MIRADI_SESSION: "Miradi session",
  OTHER: "Other",
};

export const INCOME_PAYER_TYPE_LABELS: Record<IncomePayerType, string> = {
  PARENT: "Parent",
  SCHOOL: "School",
  ORGANISATION: "Organisation",
};

/**
 * A single income record for finance reporting. Can be derived from a paid Invoice
 * or created as a manual entry. Used for filtering and grouping by session type,
 * organisation, and payer type.
 */
export interface IncomeEntry {
  id: string;
  amount: number;
  date: string; // ISO
  description?: string | null;
  sessionType: IncomeSessionType; // from session/programme type
  organisationId?: string | null; // school/org/Miradi
  payerType: IncomePayerType; // who actually pays (PARENT | SCHOOL | ORGANISATION)
  /** Optional link back to invoice when derived from invoice payment. */
  invoiceId?: string | null;
}

export interface EventEntity {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  target: string;
}

export interface Feedback {
  sessionId: string;
  studentId: string;
  rating: number;
  understood: "yes" | "no" | "somewhat";
  likedMost: string;
  improvement: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

/** For absent: was it excused or unexcused (for alerts/reports). */
export type AbsenceType = "excused" | "unexcused";

/** Attendance for one learner in one session. id optional when creating; set when stored in a list. */
export interface AttendanceRecord {
  id?: string;
  sessionId: string;
  learnerId: string;
  status: AttendanceStatus;
  /** Stars given this session (e.g. 0–3). */
  stars?: number;
  /** Only when status === "absent". */
  absenceType?: AbsenceType;
  /** Optional note per learner/session (e.g. "arrived 30 mins late", "left early"). */
  notes?: string;
  /** When the mark was saved (for audit). */
  markedAt?: string; // ISO
  /** Who marked it (userId). */
  markedBy?: string;
}

/** Alias for prompt/API compatibility. */
export type Attendance = AttendanceRecord;

// ——— HR (Staff) ———
export type EmploymentStatus = "applicant" | "active" | "on_leave" | "exited";
export type ContractType = "full_time" | "part_time" | "contractor" | "volunteer";
export type PayType = "per_session" | "salary" | "stipend";
export type PreferredPaymentMethod = "bank_transfer" | "cash" | "eft" | "other";

export interface StaffDocument {
  id: string;
  name: string;
  type: string; // e.g. "certification", "contract", "id"
  uploadedAt?: string;
}

export interface StaffMember {
  id: string; // same as AppUser.id for staff
  name: string;
  email: string;
  role: UserRole; // admin | educator | finance only for staff
  phone?: string;
  employmentStatus: EmploymentStatus;
  hireDate?: string;
  contractType?: ContractType;
  skills?: string[];
  notes?: string;
  payType?: PayType;
  baseRate?: number;
  preferredPaymentMethod?: PreferredPaymentMethod;
  documents?: StaffDocument[];
  createdAt?: string;
}

// ——— System setup (programs, terms, locations, finance config) ———
export interface Program {
  id: string;
  name: string;
  description?: string;
}

export interface Term {
  id: string;
  name: string;
  year: number;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}

export interface Location {
  id: string;
  name: string;
  address?: string;
}

export interface AgeGroup {
  id: string;
  name: string;
  minAge?: number;
  maxAge?: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  code?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code?: string;
}

// Educator payment (Finance module)
export type EducatorPaymentType = "stipend" | "salary" | "bonus";
export type EducatorPaymentStatus = "planned" | "pending" | "paid";

export interface EducatorPayment {
  id: string;
  educatorId: string;
  period: string; // e.g. "2025-01" or "Term 1 2025"
  type: EducatorPaymentType;
  amount: number;
  status: EducatorPaymentStatus;
  datePaid?: string; // ISO
  notes?: string;
}

// Expense (Finance module)
export type ExpenseCategoryType =
  | "rent"
  | "internet"
  | "utilities"
  | "repairs"
  | "equipment"
  | "supplies"
  | "transport"
  | "marketing"
  | "events"
  | "misc";

export interface Expense {
  id: string;
  category: ExpenseCategoryType;
  description: string;
  amount: number;
  date: string; // ISO
  paidTo: string;
  reference?: string;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryType, string> = {
  rent: "Rent",
  internet: "Internet",
  utilities: "Utilities",
  repairs: "Repairs",
  equipment: "Equipment",
  supplies: "Supplies",
  transport: "Transport",
  marketing: "Marketing",
  events: "Events",
  misc: "Misc",
};

export const INVOICE_SOURCE_LABELS: Record<InvoiceSource, string> = {
  school_club: "School STEM Club",
  makerspace: "Makerspace",
  home_session: "Home sessions",
  organization: "Organization",
  miradi: "Miradi",
  camp: "Camps",
  other: "Other",
  donation: "Donation",
};

/** Short label for UI: who is billed / who pays (school and org pay directly; learners/parents pay for other sources). */
export const INVOICE_PAYER_LABELS: Record<InvoicePayerType, string> = {
  school: "Invoice to school (school pays)",
  organization: "Invoice to organisation (org pays)",
  learner: "Learner / parent",
};

// ——— Inventory ———
export type InventoryCategory =
  | "laptop"
  | "robot"
  | "kit"
  | "projector"
  | "other";

export type InventoryStatus =
  | "available"
  | "assigned"
  | "checked_out"
  | "under_maintenance"
  | "retired";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  assetTag?: string | null;
  quantity: number;
  location: string;
  status: InventoryStatus;
  purchaseDate?: string | null; // ISO date
  notes?: string | null;
  assignedEducatorId?: string | null;
  /** Set when status is checked_out; who has the device. */
  checkedOutByEducatorId?: string | null;
  checkedOutAt?: string | null; // ISO date string
  dueAt?: string | null; // ISO date string
}

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  laptop: "Laptop",
  robot: "Robot",
  kit: "Kit",
  projector: "Projector",
  other: "Other",
};

export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  available: "Available",
  assigned: "Assigned",
  checked_out: "Checked out",
  under_maintenance: "Under maintenance",
  retired: "Retired",
};

// ——— Educator session expense requests ———
export type EducatorSessionExpenseStatus = "requested" | "issued" | "paid";

export interface EducatorSessionExpense {
  id: string;
  educatorId: string;
  sessionId: string;
  schoolName: string;
  transportTo: number;
  transportFrom: number;
  otherAmount?: number;
  totalRequested: number;
  status: EducatorSessionExpenseStatus;
  requestedAt: string; // ISO date
  issuedAt?: string;
  paidAt?: string;
  processedBy?: string; // finance userId
  notes?: string;
}

// ——— Session Report (post-session form, one per session) ———
export type SessionReportStatus = "draft" | "submitted";

export type ObjectivesMet = "yes" | "partially" | "no";

/** Engagement scale 1–5. */
export type EngagementLevel = 1 | 2 | 3 | 4 | 5;

/** Coach feedback on a session report (one entry per coach). */
export interface CoachFeedbackEntry {
  educatorId: string;
  text: string;
  createdAt: string; // ISO
}

export interface SessionReport {
  id: string;
  sessionId: string;
  status: SessionReportStatus;
  /** Single lead facilitator (educator/user ID). */
  leadEducatorId: string;
  /** Up to 4 assistant facilitators (educator/user IDs), or [] if no coach. */
  assistantEducatorIds: string[];
  date: string; // session date (editable)
  duration: SessionDuration;
  sessionType: SessionType;
  schoolOrOrganizationName: string;
  totalLearners: number;
  learningTrack: LearningTrack;
  /** Teaching duration in hours for aggregation (aligns with Session.durationHours). */
  durationHours: number;
  femaleCount: number;
  maleCount: number;
  exceptionalLearnersNotes?: string;
  engagementLevel?: EngagementLevel;
  ranAsPlanned: boolean;
  ranAsPlannedNotes?: string;
  technicalChallenges: boolean;
  technicalChallengesDescription?: string;
  highlights: string[];
  objectivesMet: ObjectivesMet;
  curriculumAdjustmentsSuggested: boolean;
  curriculumAdjustmentsDescription?: string;
  incidentOccurred: boolean;
  incidentFollowUp?: string;
  equipmentReturned: boolean;
  honestyConfirmed: boolean;
  /** Coach feedback entries (visible to admin, facilitator, and the coach who wrote each). */
  coachFeedback?: CoachFeedbackEntry[];
  submittedAt?: string; // ISO, when status became submitted
  createdAt?: string;
  updatedAt?: string;
}

// ——— Admin Session Reports (list & detail view) ———
/** Session type for admin report list/detail (uppercase labels). */
export type SessionReportSessionTypeAdmin =
  | "MAKERSPACE"
  | "SCHOOL_STEM_CLUB"
  | "VIRTUAL"
  | "HOME"
  | "ORGANISATION"
  | "MIRADI";

/** Status for admin list: submitted, missing (no/draft report), or flagged (e.g. incident). */
export type SessionReportStatusAdmin = "SUBMITTED" | "MISSING" | "FLAGGED";

/** One row on the admin session reports list. */
export interface SessionReportSummary {
  id: string;
  sessionId: string;
  sessionDate: string; // ISO
  sessionType: SessionReportSessionTypeAdmin;
  organisationName: string;
  className: string;
  leadEducatorName: string;
  presentCount: number;
  totalLearners: number;
  engagementRating?: number | null; // 1–5
  status: SessionReportStatusAdmin;
}

/** Detail view: summary + notes, challenges, stars/badges, incidents, follow-up. */
export interface SessionReportDetailView extends SessionReportSummary {
  notes?: string | null;
  challenges?: string | null;
  starsGiven?: number;
  badgesSummary?: Record<string, number>;
  incidents?: string | null;
  followUpActions?: string | null;
}

export const SESSION_REPORT_SESSION_TYPE_ADMIN_LABELS: Record<SessionReportSessionTypeAdmin, string> = {
  MAKERSPACE: "Makerspace",
  SCHOOL_STEM_CLUB: "School STEM Club",
  VIRTUAL: "Virtual",
  HOME: "Home",
  ORGANISATION: "Organisation",
  MIRADI: "Miradi",
};

export const SESSION_REPORT_STATUS_ADMIN_LABELS: Record<SessionReportStatusAdmin, string> = {
  SUBMITTED: "Submitted",
  MISSING: "Missing",
  FLAGGED: "Flagged",
};

/** Map stored SessionType to admin list session type. */
export function toSessionReportSessionTypeAdmin(sessionType: SessionType): SessionReportSessionTypeAdmin {
  const map: Record<SessionType, SessionReportSessionTypeAdmin> = {
    makerspace: "MAKERSPACE",
    school_stem_club: "SCHOOL_STEM_CLUB",
    virtual: "VIRTUAL",
    home: "HOME",
    organization: "ORGANISATION",
    miradi: "MIRADI",
  };
  return map[sessionType] ?? "ORGANISATION";
}

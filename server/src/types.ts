/**
 * API types aligned with docs/API_CONTRACTS.md and frontend types.
 */

export type UserRole =
  | "admin"
  | "educator"
  | "finance"
  | "student"
  | "parent"
  | "organisation"
  | "partnerships"
  | "marketing"
  | "social_media"
  | "ld_manager";

export type UserStatus = "pending" | "active" | "rejected";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  status?: UserStatus;
  organizationId?: string | null;
  membershipStatus?: "active" | "inactive" | "expired";
  avatarId?: string | null;
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export type LearnerEnrolmentType = "member" | "partner_org";
export type LearnerProgramType = "MAKERSPACE" | "SCHOOL_CLUB" | "ORGANISATION";

export interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  school: string;
  enrolmentType: LearnerEnrolmentType;
  programType: LearnerProgramType;
  membershipStatus?: "active" | "inactive" | "expired" | null;
  userId?: string | null;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  organizationId?: string | null;
  status: "active" | "alumni";
  gender?: "male" | "female" | "other" | null;
  joinedAt?: string | null;
}

export interface ClassEntity {
  id: string;
  name: string;
  program: string;
  ageGroup: string;
  location: string;
  educatorId: string;
  termId: string;
  learnerIds: string[];
  capacity?: number | null;
}

export type SessionType =
  | "makerspace"
  | "school_stem_club"
  | "virtual"
  | "home"
  | "organization"
  | "miradi";

export interface Session {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  sessionType: SessionType;
  durationHours: number;
  learningTrack: string;
  termId: string;
  leadEducatorId: string;
  assistantEducatorIds: string[];
}

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type PayerType = "parent" | "organisation";

export interface FinanceInvoice {
  id: string;
  payerType: PayerType;
  payerId: string;
  learnerId?: string | null;
  organisationId?: string | null;
  termId: string;
  programmeId?: string | null;
  trackId?: string | null;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  amountPaid: number;
  balance: number;
  currency: string;
  dueDate: string;
  issueDate: string;
  status: InvoiceStatus;
  notes?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export type PaymentMethod =
  | "mpesa"
  | "bank_transfer"
  | "cash"
  | "card"
  | "other";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  date: string;
  recordedBy: string;
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

import type { UserRole } from "@/types";

export interface RoleResponsibilities {
  label: string;
  responsibilities: string[];
}

const BY_ROLE: Record<UserRole, RoleResponsibilities> = {
  admin: {
    label: "Admin",
    responsibilities: [
      "System and operations oversight across the organisation",
      "HR: staff directory, team profiles, account approvals",
      "Finance oversight: educator payments, income, expenses",
      "Session reports review and follow-up",
      "Schedule and calendar visibility for the whole team",
    ],
  },
  educator: {
    label: "Educator",
    responsibilities: [
      "Deliver sessions and facilitate learning for learners",
      "Mark attendance and submit session reports",
      "Log session expenses (where applicable)",
      "Use lesson plans and manage class content",
      "View your schedule and team schedule",
      "Earn and track badges; complete tasks assigned by L&D",
    ],
  },
  finance: {
    label: "Finance",
    responsibilities: [
      "Manage invoicing, income, and expenses",
      "Record received donations (partnerships)",
      "Oversee payments and financial reports",
      "Link to grants and funding pipeline with Partnerships",
    ],
  },
  student: {
    label: "Student / Learner",
    responsibilities: [
      "Attend sessions and complete activities",
      "Earn badges and view your progress",
      "See today's sessions and feedback from educators",
    ],
  },
  parent: {
    label: "Parent",
    responsibilities: [
      "View your children's attendance and sessions",
      "See invoices and make payments",
      "Access child profiles and progress",
    ],
  },
  organisation: {
    label: "Organisation representative",
    responsibilities: [
      "View learners linked to your organisation",
      "Access organisation-level invoices and details",
    ],
  },
  partnerships: {
    label: "Partnerships & Communications",
    responsibilities: [
      "Manage active partnerships and prospects",
      "Track grants and funding opportunities",
      "Align campaigns with partnerships; view funds secured",
      "Coordinate with Marketing and Finance on donations",
    ],
  },
  marketing: {
    label: "Marketing & Strategy",
    responsibilities: [
      "Plan and run marketing campaigns",
      "Own brand kit and AI Marketing Canvas",
      "Coverage of locations and programmes",
    ],
  },
  social_media: {
    label: "Social Media",
    responsibilities: [
      "Create and schedule social content aligned with campaigns",
      "Maintain brand visibility; use Brand Kit",
      "Submit posts for review; coordinate with Marketing",
    ],
  },
  ld_manager: {
    label: "L&D Manager",
    responsibilities: [
      "Support curriculum and lesson plan quality",
      "Coach educators; track session reports and feedback",
      "Manage tasks and learning tracks",
    ],
  },
};

export function getRoleResponsibilities(role: UserRole): RoleResponsibilities {
  return BY_ROLE[role] ?? { label: role, responsibilities: [] };
}

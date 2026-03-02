/**
 * Mock data for Marketing & Strategy command center (dashboard, tasks, KPIs, approvals).
 */

export interface MarketingTask {
  id: string;
  title: string;
  campaignId?: string;
  dueDate?: string;
  status: "todo" | "in_progress" | "done";
  createdAt: string;
}

export interface MarketingApproval {
  id: string;
  eventOrCampaignId: string;
  title: string;
  fromRole: string;
  note: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface MarketingKpis {
  totalRegistrationsThisTerm: number;
  linkClicksOrVisits: number;
  topEventsBySignups: { eventId: string; eventTitle: string; signups: number }[];
  awarenessScore: number; // 0–100
  registrationsTrend: number; // % change vs previous period
}

export interface MyEventSummary {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  startDate: string;
  registrationsCount: number;
  visibilitySummary: string; // e.g. "3 orgs, 2 schools"
}

export interface UpcomingCampaignSummary {
  id: string;
  name: string;
  type: string;
  startDate: string;
  channel?: string;
}

export const MOCK_MARKETING_TASKS: MarketingTask[] = [
  { id: "mt1", title: "Design poster for Enjoy AI 2026", campaignId: "mc1", dueDate: "2026-03-01", status: "in_progress", createdAt: "2026-02-20" },
  { id: "mt2", title: "Send email to tagged schools for April Bootcamp", campaignId: "mc2", dueDate: "2026-03-10", status: "todo", createdAt: "2026-02-22" },
  { id: "mt3", title: "Post recap on Instagram after STEM Fair", campaignId: "mc1", dueDate: "2026-03-16", status: "todo", createdAt: "2026-02-25" },
  { id: "mt4", title: "Update pitch deck with Q2 programmes", status: "todo", dueDate: "2026-03-31", createdAt: "2026-02-26" },
];

export const MOCK_MARKETING_APPROVALS: MarketingApproval[] = [
  { id: "ma1", eventOrCampaignId: "e1", title: "Enjoy AI 2026 Launch", fromRole: "Ops", note: "Increase capacity for Nairobi venue.", status: "approved", createdAt: "2026-02-18" },
  { id: "ma2", eventOrCampaignId: "e2", title: "April Bootcamp Push", fromRole: "CEO", note: "Target Miradi X and add 2 more schools.", status: "pending", createdAt: "2026-02-24" },
  { id: "ma3", eventOrCampaignId: "mc3", title: "School sign-up drive", fromRole: "Ops", note: "Approved. Go live.", status: "approved", createdAt: "2026-02-01" },
];

export const MOCK_MARKETING_KPIS: MarketingKpis = {
  totalRegistrationsThisTerm: 142,
  linkClicksOrVisits: 1280,
  topEventsBySignups: [
    { eventId: "e1", eventTitle: "Enjoy AI 2026 Info Session", signups: 68 },
    { eventId: "e2", eventTitle: "April Bootcamp Launch", signups: 45 },
    { eventId: "e3", eventTitle: "STEM Fair 2026", signups: 29 },
  ],
  awarenessScore: 72,
  registrationsTrend: 18,
};

export const MOCK_MY_EVENTS: MyEventSummary[] = [
  { id: "e1", title: "Enjoy AI 2026 Info Session", status: "PUBLISHED", startDate: "2026-03-05", registrationsCount: 68, visibilitySummary: "4 orgs, 3 schools, 2 miradis" },
  { id: "e2", title: "April Bootcamp Launch", status: "DRAFT", startDate: "2026-04-12", registrationsCount: 0, visibilitySummary: "2 schools" },
  { id: "e3", title: "STEM Fair 2026", status: "PUBLISHED", startDate: "2026-03-15", registrationsCount: 29, visibilitySummary: "All" },
];

export const MOCK_UPCOMING_CAMPAIGNS: UpcomingCampaignSummary[] = [
  { id: "mc1", name: "Enjoy AI 2026 Teasers", type: "Social", startDate: "2026-03-01", channel: "Instagram, TikTok" },
  { id: "mc2", name: "April Bootcamp Push", type: "Email", startDate: "2026-03-10", channel: "Newsletter" },
  { id: "mc3", name: "School sign-up drive", type: "Social", startDate: "2026-02-01", channel: "Facebook, Instagram" },
];

/** Org/locations and programmes the marketing lead covers (for profile). */
export const MOCK_MARKETING_ORG_COVERAGE = {
  locations: ["Kenya", "Nairobi", "Mombasa"],
  programmes: ["Enjoy AI", "Bootcamps", "STEM Fair", "Makerspace Sessions", "School STEM Club"],
};

/** Brand kit links (mock). */
export const MOCK_BRAND_KIT_LINKS = {
  logoFiles: "/cwk-logo.png",
  canvaFolder: "https://www.canva.com/",
  figmaFolder: "https://www.figma.com/",
  templates: [
    { name: "Social media templates", url: "#" },
    { name: "Posters & flyers", url: "#" },
    { name: "Pitch deck template", url: "#" },
  ],
};

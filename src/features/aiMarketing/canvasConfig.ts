/**
 * AI Marketing Canvas – Stages 1–5 (Foundation → Monetization).
 * Config drives Overview, Canvas, and Experiments views. Mock data for now.
 */

export type MarketingStageId = 1 | 2 | 3 | 4 | 5;

export type MarketingMoment =
  | "ACQUISITION"
  | "RETENTION"
  | "GROWTH"
  | "ADVOCACY";

export type ExperimentStatus =
  | "NOT_STARTED"
  | "PLANNING"
  | "RUNNING"
  | "SCALED";

export interface CanvasInitiative {
  id: string;
  title: string;
  description: string;
  moment: MarketingMoment;
  status: ExperimentStatus;
  linkPath?: string;
}

export interface CanvasStage {
  id: MarketingStageId;
  name: string;
  description: string;
  initiatives: CanvasInitiative[];
  keyQuestions: string[];
}

export const STAGE_NAMES: Record<MarketingStageId, string> = {
  1: "Foundation",
  2: "Experimentation",
  3: "Expansion",
  4: "Transformation",
  5: "Monetization",
};

export const canvasStages: CanvasStage[] = [
  {
    id: 1,
    name: "Foundation",
    description:
      "Centralise data, link attendance, payments, and core systems so AI can use a single source of truth.",
    initiatives: [
      {
        id: "s1-data-central",
        title: "Centralise learner and session data",
        description: "Single source of truth for attendance, enrolments, and payments.",
        moment: "RETENTION",
        status: "RUNNING",
        linkPath: "/admin/learners",
      },
      {
        id: "s1-payments-link",
        title: "Link payments and invoicing to sessions",
        description: "Connect finance data to programme delivery for ROI visibility.",
        moment: "GROWTH",
        status: "PLANNING",
        linkPath: "/finance/invoices",
      },
      {
        id: "s1-attendance-tracking",
        title: "Structured attendance and roll-call",
        description: "Consistent attendance data for churn and engagement analysis.",
        moment: "RETENTION",
        status: "RUNNING",
        linkPath: "/educator/schedule",
      },
    ],
    keyQuestions: [
      "Do we have one place where attendance, payments, and enrolments are linked?",
      "Can we reliably report on who showed up vs who paid?",
    ],
  },
  {
    id: 2,
    name: "Experimentation",
    description:
      "AI-powered ads, reminders, basic recommendations, and sentiment for advocates.",
    initiatives: [
      {
        id: "s2-ai-ads",
        title: "AI-driven acquisition ads",
        description: "Test AI-generated or AI-optimised ad copy and targeting.",
        moment: "ACQUISITION",
        status: "PLANNING",
        linkPath: "/marketing/campaigns",
      },
      {
        id: "s2-ai-reminders",
        title: "AI WhatsApp / SMS reminders",
        description: "Reduce no-shows with automated, personalised reminders.",
        moment: "RETENTION",
        status: "RUNNING",
        linkPath: "/communications",
      },
      {
        id: "s2-basic-recommendations",
        title: "Basic next-course recommendations",
        description: "Simple rules (e.g. “completed X → suggest Y”) on events or courses.",
        moment: "GROWTH",
        status: "PLANNING",
        linkPath: "/events",
      },
      {
        id: "s2-sentiment-advocates",
        title: "Sentiment and advocate identification",
        description: "Use feedback or NPS to surface happy parents and champions.",
        moment: "ADVOCACY",
        status: "NOT_STARTED",
        linkPath: "/marketing/campaigns",
      },
    ],
    keyQuestions: [
      "Which channels (WhatsApp, email, ads) are we testing with AI first?",
      "How do we define and track ‘advocate’ or promoter families?",
    ],
  },
  {
    id: 3,
    name: "Expansion",
    description:
      "Ideal parent/school profiles, churn risk scores, personas, and a champions programme.",
    initiatives: [
      {
        id: "s3-ideal-profiles",
        title: "Ideal parent and school profiles",
        description: "Data-driven profiles of who converts and stays.",
        moment: "ACQUISITION",
        status: "NOT_STARTED",
        linkPath: "/admin/learners",
      },
      {
        id: "s3-churn-risk",
        title: "Churn risk scores",
        description: "Early signals for at-risk learners or schools.",
        moment: "RETENTION",
        status: "PLANNING",
        linkPath: "/analytics/retention",
      },
      {
        id: "s3-personas",
        title: "Personas and segments",
        description: "Stable segments (e.g. by programme, location, tenure) for targeting.",
        moment: "GROWTH",
        status: "NOT_STARTED",
        linkPath: "/marketing/dashboard",
      },
      {
        id: "s3-champions",
        title: "Champions programme",
        description: "Structured programme to recruit and reward advocate parents/schools.",
        moment: "ADVOCACY",
        status: "NOT_STARTED",
        linkPath: "/marketing/campaigns",
      },
    ],
    keyQuestions: [
      "What data do we need to build a simple churn risk score?",
      "How will we recruit and reward champions in a repeatable way?",
    ],
  },
  {
    id: 4,
    name: "Transformation",
    description:
      "ML-driven optimisation, churn models, next-best-course engine, and advocacy journeys.",
    initiatives: [
      {
        id: "s4-ml-optimisation",
        title: "ML-driven campaign and channel optimisation",
        description: "Automate budget and creative tests using ML.",
        moment: "ACQUISITION",
        status: "NOT_STARTED",
        linkPath: "/marketing/campaigns",
      },
      {
        id: "s4-churn-models",
        title: "Churn prediction models",
        description: "Predictive models to intervene before drop-off.",
        moment: "RETENTION",
        status: "NOT_STARTED",
        linkPath: "/analytics/retention",
      },
      {
        id: "s4-next-best-course",
        title: "Next-best-course recommendation engine",
        description: "Personalised course or event recommendations per learner/school.",
        moment: "GROWTH",
        status: "NOT_STARTED",
        linkPath: "/events",
      },
      {
        id: "s4-advocacy-journeys",
        title: "Advocacy journeys and referral flows",
        description: "Structured journeys from advocate to referral or review.",
        moment: "ADVOCACY",
        status: "NOT_STARTED",
        linkPath: "/marketing/campaigns",
      },
    ],
    keyQuestions: [
      "Do we have enough historical data to train a churn or next-best-action model?",
      "How do we measure advocacy impact (referrals, reviews, NPS)?",
    ],
  },
  {
    id: 5,
    name: "Monetization",
    description:
      "EdTech Reach Platform, retention dashboards, white-label recommendation engine, partner community.",
    initiatives: [
      {
        id: "s5-edtech-reach",
        title: "EdTech Reach Platform",
        description: "Platform to extend programmes to more schools and partners.",
        moment: "GROWTH",
        status: "NOT_STARTED",
        linkPath: "/partnerships",
      },
      {
        id: "s5-retention-dashboards",
        title: "Retention dashboards",
        description: "Executive and ops dashboards for retention and engagement.",
        moment: "RETENTION",
        status: "NOT_STARTED",
        linkPath: "/analytics/retention",
      },
      {
        id: "s5-white-label-recs",
        title: "White-label recommendation engine",
        description: "Licensable or partner-facing “next best” recommendations.",
        moment: "GROWTH",
        status: "NOT_STARTED",
        linkPath: "/partnerships",
      },
      {
        id: "s5-partner-community",
        title: "Partner community and success",
        description: "Community and tools for partners using CWK products.",
        moment: "ADVOCACY",
        status: "NOT_STARTED",
        linkPath: "/partnerships",
      },
    ],
    keyQuestions: [
      "Which Stage 5 products are we prioritising (Reach, dashboards, white-label)?",
      "How do we price and package for schools vs NGOs vs churches?",
    ],
  },
];

/** Flatten all initiatives with stage info for experiments board */
export function getAllInitiatives(): (CanvasInitiative & { stageId: MarketingStageId; stageName: string })[] {
  return canvasStages.flatMap((stage) =>
    stage.initiatives.map((init) => ({
      ...init,
      stageId: stage.id,
      stageName: stage.name,
    }))
  );
}

// ---- Stage 5 Products (Monetization) ----

export type FutureProductStatus = "IDEA" | "MVP" | "PILOT" | "LAUNCHED";

export interface FutureProduct {
  id: string;
  name: string;
  description: string;
  targetCustomers: string[];
  status: FutureProductStatus;
  linkPath?: string;
}

export const futureProducts: FutureProduct[] = [
  {
    id: "fp-edtech-reach",
    name: "EdTech Reach Platform",
    description: "Platform to extend Code With Kids programmes to more schools and partners with standardised delivery and reporting.",
    targetCustomers: ["schools", "NGOs", "churches", "partners"],
    status: "IDEA",
    linkPath: "/partnerships",
  },
  {
    id: "fp-retention-dashboards",
    name: "Retention dashboards",
    description: "Executive and ops dashboards for retention, churn risk, and engagement metrics.",
    targetCustomers: ["internal ops", "school admins"],
    status: "IDEA",
    linkPath: "/analytics/retention",
  },
  {
    id: "fp-white-label-recs",
    name: "White-label recommendation engine",
    description: "Licensable or partner-facing “next best course” or “next best action” recommendations.",
    targetCustomers: ["partners", "schools", "NGOs"],
    status: "IDEA",
    linkPath: "/partnerships",
  },
  {
    id: "fp-partner-community",
    name: "Partner community and success",
    description: "Community portal and tools for partners using CWK products, with success metrics and support.",
    targetCustomers: ["partners", "churches", "NGOs"],
    status: "IDEA",
    linkPath: "/partnerships",
  },
];

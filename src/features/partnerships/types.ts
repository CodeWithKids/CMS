/**
 * Partnership & Funding feature types (Prospects, Grants).
 * Frontend-only for now; replace with API types later.
 */

export type ProspectType =
  | "SCHOOL"
  | "NGO"
  | "COMPANY"
  | "FOUNDATION"
  | "CHURCH"
  | "CBO"
  | "INDIVIDUAL";

export type ProspectInterest =
  | "PROGRAMME_PARTNER"
  | "IN_KIND_EQUIPMENT"
  | "FINANCIAL_SUPPORT"
  | "VOLUNTEERS"
  | "OTHER";

export type ProspectStage =
  | "NEW"
  | "CONTACTED"
  | "MEETING"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "CONVERTED"
  | "LOST";

export interface Prospect {
  id: string;
  name: string;
  type: ProspectType;
  interestAreas: ProspectInterest[];
  location?: string;
  mainContactName?: string;
  mainContactEmail?: string;
  mainContactPhone?: string;
  stage: ProspectStage;
  potentialValueKes?: number;
  notes?: string;
  linkedCampaignIds?: string[];
  linkedEventIds?: string[];
}

export type FundingType = "GRANT" | "CSR" | "SPONSORSHIP" | "DONATION";

export type FundingStage =
  | "IDEA"
  | "SCOPING"
  | "APPLYING"
  | "SUBMITTED"
  | "AWARDED"
  | "DECLINED";

export interface GrantOpportunity {
  id: string;
  name: string;
  funderName: string;
  fundingType: FundingType;
  amountKes?: number;
  currency?: string;
  country?: string;
  programmeFocus?: string;
  deadline?: string;
  stage: FundingStage;
  probability?: number;
  expectedDecisionDate?: string;
  awardedDate?: string;
  linkedPartnerId?: string;
  /** Person leading the grant application */
  leadName?: string;
  /** People assisting with the application */
  assistantNames?: string[];
  notes?: string;
}

/** Donation received and recorded by finance; shown on partnerships as funds secured. */
export interface ReceivedDonation {
  id: string;
  amountKes: number;
  receivedDate: string; // ISO date
  donorName: string;
  linkedGrantId?: string;
  linkedPartnerId?: string;
  notes?: string;
  recordedAt: string; // ISO datetime
  recordedBy?: string;
}

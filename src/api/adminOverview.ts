import type { AdminOverviewSummary } from "@/types";

/**
 * GET /api/admin/overview
 * Returns active partners (schools, organisations, FCP) and learners by learning track.
 * Response body must match AdminOverviewSummary.
 */
export type GetAdminOverviewResponse = AdminOverviewSummary;

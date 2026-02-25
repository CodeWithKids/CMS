import type { LearnerAdminProfile } from "@/types";

/**
 * GET /api/admin/learners/:id
 * Returns the full read-only admin profile for a learner.
 * Response body must match LearnerAdminProfile.
 */
export type GetLearnerAdminProfileResponse = LearnerAdminProfile;

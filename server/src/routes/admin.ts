import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireAuth, type AuthLocals } from "../middleware/auth.js";
import { sendError } from "../middleware/error.js";

const router = Router();

const TEAM_ROLES = ["admin", "educator", "finance", "partnerships", "marketing", "social_media", "ld_manager"];
/** Roles admin can create via POST /accounts (team + parent). Organisation uses POST /accounts/organisation. */
const ACCOUNT_CREATE_ROLES = [...TEAM_ROLES, "parent"];
const MIN_PASSWORD_LENGTH = 6;
const ORG_TYPES = ["school", "organisation", "miradi", "other"] as const;

type AuthedRequest = Request & { auth?: AuthLocals };

function isAdmin(req: AuthedRequest): boolean {
  return req.auth?.user?.role === "admin";
}

/** POST /v1/admin/accounts - create a team member (admin only). Internal team = invited/created by admin, no public signup. */
router.post("/accounts", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const organizationId = body.organizationId !== undefined ? (body.organizationId as string | null) : null;

  if (!name || !email || !role || !password) {
    sendError(res, 400, "VALIDATION_ERROR", "Name, email, role, and password are required.");
    return;
  }
  if (!ACCOUNT_CREATE_ROLES.includes(role)) {
    sendError(res, 400, "VALIDATION_ERROR", `Role must be one of: ${ACCOUNT_CREATE_ROLES.join(", ")}. For organisation accounts use Create organisation account.`);
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    sendError(res, 400, "VALIDATION_ERROR", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    sendError(res, 400, "VALIDATION_ERROR", "A user with this email already exists.");
    return;
  }

  const id = `u-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      role,
      status: "active",
      organizationId: organizationId || undefined,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      organizationId: true,
      membershipStatus: true,
      avatarId: true,
      createdAt: true,
    },
  });
  res.status(201).json(user);
});

/** POST /v1/admin/accounts/organisation - create organisation + linked user (admin only). */
router.post("/accounts/organisation", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const organisationName = typeof body.organisationName === "string" ? body.organisationName.trim() : "";
  const type = typeof body.type === "string" && ORG_TYPES.includes(body.type as (typeof ORG_TYPES)[number])
    ? (body.type as (typeof ORG_TYPES)[number])
    : "organisation";
  const contactPerson = typeof body.contactPerson === "string" ? body.contactPerson.trim() : "";
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() : "";
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : null;
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!organisationName || !contactPerson || !contactEmail) {
    sendError(res, 400, "VALIDATION_ERROR", "Organisation name, contact person, and contact email are required.");
    return;
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    sendError(res, 400, "VALIDATION_ERROR", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: contactEmail, mode: "insensitive" } },
  });
  if (existingUser) {
    sendError(res, 400, "VALIDATION_ERROR", "A user with this email already exists.");
    return;
  }
  const nameLower = organisationName.toLowerCase();
  const existingOrg = await prisma.organisation.findFirst({
    where: { name: { equals: organisationName, mode: "insensitive" } },
  });
  if (existingOrg) {
    sendError(res, 400, "VALIDATION_ERROR", "An organisation with this name already exists.");
    return;
  }

  const orgId = `org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const userId = `u-org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = bcrypt.hashSync(password, 10);

  await prisma.organisation.create({
    data: {
      id: orgId,
      name: organisationName,
      type,
      contactPerson,
      contactEmail,
      contactPhone: contactPhone || undefined,
      location: location || "",
    },
  });
  const user = await prisma.user.create({
    data: {
      id: userId,
      name: contactPerson,
      role: "organisation",
      email: contactEmail,
      status: "active",
      organizationId: orgId,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      organizationId: true,
      membershipStatus: true,
      avatarId: true,
      createdAt: true,
    },
  });
  res.status(201).json({ user, organisationId: orgId });
});

/** GET /v1/admin/accounts - list users (e.g. status=pending). Admin only. */
router.get("/accounts", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const where = status ? { status } : {};
  const list = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      organizationId: true,
      membershipStatus: true,
      avatarId: true,
      createdAt: true,
    },
  });
  res.json(list);
});

/** PATCH /v1/admin/accounts/:id - approve/reject or update user. Admin only. */
router.patch("/accounts/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const email = typeof body.email === "string" ? body.email.trim() : undefined;
  const status = typeof body.status === "string" ? body.status : undefined;
  const role = typeof body.role === "string" ? body.role : undefined;
  const organizationId = body.organizationId !== undefined ? (body.organizationId as string | null) : undefined;

  if (name !== undefined && !name.length) {
    sendError(res, 400, "VALIDATION_ERROR", "Name cannot be empty.");
    return;
  }
  if (email !== undefined) {
    if (!email.length) {
      sendError(res, 400, "VALIDATION_ERROR", "Email cannot be empty.");
      return;
    }
    const existingByEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, id: { not: id } },
    });
    if (existingByEmail) {
      sendError(res, 400, "VALIDATION_ERROR", "A user with this email already exists.");
      return;
    }
  }

  const data: { name?: string; email?: string; status?: string; role?: string; organizationId?: string | null } = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (status) data.status = status;
  if (role) data.role = role;
  if (organizationId !== undefined) data.organizationId = organizationId;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      organizationId: true,
      membershipStatus: true,
      avatarId: true,
      createdAt: true,
    },
  });
  res.json(updated);
});

/** DELETE /v1/admin/accounts/:id - delete a user account (admin only). Admins cannot delete their own account. */
router.delete("/accounts/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const currentUserId = (req as AuthedRequest).auth?.user.id;
  if (currentUserId && id === currentUserId) {
    sendError(res, 400, "VALIDATION_ERROR", "You cannot delete your own account.");
    return;
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
});

// ——— Admin dashboard overview (real data) ———

/** Learning track IDs matching frontend LEARNING_TRACK_LABELS for learners-by-track summary. */
const LEARNING_TRACK_IDS = [
  "computer_basics", "game_design", "web_design", "app_design", "python", "graphic_design",
  "robotics", "3d_design", "microbit", "physical_computing", "science_experiments",
  "financial_literacy", "ai", "blockchain", "esports",
] as const;

function orgTypeToOverviewType(type: string): "SCHOOL" | "ORGANISATION" | "MIRADI" {
  const t = type?.toLowerCase();
  if (t === "school") return "SCHOOL";
  if (t === "miradi") return "MIRADI";
  return "ORGANISATION";
}

function normaliseLearningTrack(s: string | null | undefined): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.toLowerCase().trim().replace(/\s+/g, "_");
  return LEARNING_TRACK_IDS.includes(t as (typeof LEARNING_TRACK_IDS)[number]) ? t : null;
}

/** GET /v1/admin/overview - dashboard aggregates (admin only). */
router.get("/overview", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }

  const [
    organisations,
    learners,
    users,
    classes,
    sessions,
    sessionReports,
    invoices,
  ] = await Promise.all([
    prisma.organisation.findMany({ orderBy: { name: "asc" } }),
    prisma.learner.findMany(),
    prisma.user.findMany({ select: { id: true, role: true, status: true } }),
    prisma.class.findMany({ select: { id: true, learnerIds: true } }),
    prisma.session.findMany({ select: { id: true, classId: true, date: true, learningTrack: true } }),
    prisma.sessionReport.findMany({ where: { status: "submitted" }, select: { sessionId: true, learningTrack: true } }),
    prisma.financeInvoice.findMany(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const activeLearners = learners.filter((l) => l.status === "active");
  const orgById = new Map(organisations.map((o) => [o.id, o]));
  const reportBySessionId = new Map(sessionReports.map((r) => [r.sessionId, r.learningTrack]));

  // Partners: active orgs with type and learner count
  let activeSchools = 0;
  let activeOrganisations = 0;
  let activeMiradis = 0;
  const activeByOrgId = new Map<string, number>();
  for (const l of activeLearners) {
    if (l.organizationId)
      activeByOrgId.set(l.organizationId, (activeByOrgId.get(l.organizationId) ?? 0) + 1);
  }
  const partners: { organisationId: string; organisationName: string; type: "SCHOOL" | "ORGANISATION" | "MIRADI"; activeLearners: number }[] = [];
  for (const o of organisations) {
    const type = orgTypeToOverviewType(o.type);
    if (type === "SCHOOL") activeSchools += 1;
    else if (type === "MIRADI") activeMiradis += 1;
    else activeOrganisations += 1;
    partners.push({
      organisationId: o.id,
      organisationName: o.name,
      type,
      activeLearners: activeByOrgId.get(o.id) ?? 0,
    });
  }

  // Learners by track: infer from class -> sessions -> report/session learningTrack
  const sessionsByClassId = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const list = sessionsByClassId.get(s.classId) ?? [];
    list.push(s);
    sessionsByClassId.set(s.classId, list);
  }
  const trackCounts = new Map<string, number>(LEARNING_TRACK_IDS.map((id) => [id, 0]));
  for (const l of activeLearners) {
    const trackCountsForLearner = new Map<string, number>();
    for (const c of classes) {
      if (!c.learnerIds.includes(l.id)) continue;
      const classSessions = sessionsByClassId.get(c.id) ?? [];
      for (const sess of classSessions) {
        const raw = reportBySessionId.get(sess.id) ?? sess.learningTrack;
        const track = normaliseLearningTrack(raw ?? "");
        if (track) trackCountsForLearner.set(track, (trackCountsForLearner.get(track) ?? 0) + 1);
      }
    }
    const entries = [...trackCountsForLearner.entries()].sort((a, b) => b[1] - a[1]);
    const topTrack = entries[0]?.[0];
    if (topTrack) trackCounts.set(topTrack, (trackCounts.get(topTrack) ?? 0) + 1);
  }
  const learnersByTrack = LEARNING_TRACK_IDS.map((learningTrackId) => ({
    learningTrackId,
    learningTrackName: learningTrackId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    learnerCount: trackCounts.get(learningTrackId) ?? 0,
  }));

  // People stats
  const activeUsers = users.filter((u) => (u.status ?? "active") === "active");
  const peopleStats = {
    activeLearners: activeLearners.length,
    activeEducators: activeUsers.filter((u) => u.role === "educator").length,
    activeParents: activeUsers.filter((u) => u.role === "parent").length,
    pendingAccounts: users.filter((u) => u.status === "pending").length,
  };

  // Finance stats (netAmount = invoiced, amountPaid = collected, balance = pending)
  let totalInvoiced = 0;
  let totalCollected = 0;
  const learnerIdsWithPending = new Set<string>();
  for (const inv of invoices) {
    totalInvoiced += inv.netAmount;
    totalCollected += inv.amountPaid;
    if (inv.balance > 0) {
      if (inv.learnerId) learnerIdsWithPending.add(inv.learnerId);
    }
  }
  const financeStats = {
    totalInvoiced,
    totalCollected,
    totalPending: totalInvoiced - totalCollected,
    learnersWithPendingPayments: learnerIdsWithPending.size,
  };

  // Session reports missing: past sessions without submitted report
  const submittedSessionIds = new Set(sessionReports.map((r) => r.sessionId));
  const sessionReportsMissingCount = sessions.filter(
    (s) => s.date < today && !submittedSessionIds.has(s.id)
  ).length;

  // Learners with pending payments (for table)
  const learnerById = new Map(learners.map((l) => [l.id, l]));
  const byLearner: Map<string, { totalInvoiced: number; totalPaid: number; pendingAmount: number; hasOverdue: boolean }> = new Map();
  for (const inv of invoices) {
    if (!inv.learnerId) continue;
    const paid = inv.amountPaid;
    const pending = inv.netAmount - paid;
    if (pending <= 0) continue;
    const existing = byLearner.get(inv.learnerId);
    const dueDate = inv.dueDate;
    const isOverdue = !!(dueDate && dueDate < today);
    byLearner.set(inv.learnerId, {
      totalInvoiced: (existing?.totalInvoiced ?? 0) + inv.netAmount,
      totalPaid: (existing?.totalPaid ?? 0) + paid,
      pendingAmount: (existing?.pendingAmount ?? 0) + pending,
      hasOverdue: existing?.hasOverdue ?? isOverdue,
    });
  }
  const learnersWithPending: {
    learnerId: string;
    learnerName: string;
    enrolmentType: string;
    payerLabel: string;
    payerPhone: string;
    payerEmail: string;
    totalInvoiced: number;
    totalPaid: number;
    pendingAmount: number;
    isOverdue: boolean;
  }[] = [];
  for (const [learnerId, summary] of byLearner) {
    const learner = learnerById.get(learnerId);
    if (!learner) continue;
    const isPartner = learner.enrolmentType === "partner_org";
    const org = learner.organizationId ? orgById.get(learner.organizationId) : undefined;
    learnersWithPending.push({
      learnerId,
      learnerName: `${learner.firstName} ${learner.lastName}`,
      enrolmentType: learner.enrolmentType ?? "member",
      payerLabel: isPartner && org ? org.name : (learner.parentName ?? "—"),
      payerPhone: isPartner && org ? (org.contactPhone ?? "") : (learner.parentPhone ?? ""),
      payerEmail: isPartner && org ? (org.contactEmail ?? "") : (learner.parentEmail ?? ""),
      totalInvoiced: summary.totalInvoiced,
      totalPaid: summary.totalPaid,
      pendingAmount: summary.pendingAmount,
      isOverdue: summary.hasOverdue,
    });
  }

  // Organisations with pending payments
  const byOrg: Map<string, { pendingAmount: number; hasOverdue: boolean }> = new Map();
  for (const inv of invoices) {
    const orgId = inv.organisationId ?? (inv.learnerId ? learnerById.get(inv.learnerId)?.organizationId : undefined);
    if (!orgId) continue;
    const pending = inv.balance;
    if (pending <= 0) continue;
    const dueDate = inv.dueDate;
    const isOverdue = !!(dueDate && dueDate < today);
    const existing = byOrg.get(orgId);
    byOrg.set(orgId, {
      pendingAmount: (existing?.pendingAmount ?? 0) + pending,
      hasOverdue: existing?.hasOverdue ?? isOverdue,
    });
  }
  const organizationsWithPending: {
    organizationId: string;
    organizationName: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    pendingAmount: number;
    isOverdue: boolean;
  }[] = [];
  for (const [orgId, summary] of byOrg) {
    const org = orgById.get(orgId);
    if (!org) continue;
    organizationsWithPending.push({
      organizationId: org.id,
      organizationName: org.name,
      contactPerson: org.contactPerson,
      contactPhone: org.contactPhone ?? "",
      contactEmail: org.contactEmail ?? "",
      pendingAmount: summary.pendingAmount,
      isOverdue: summary.hasOverdue,
    });
  }

  // Pending users (status = 'pending') for approvals table
  const pendingUsersList = await prisma.user.findMany({
    where: { status: "pending" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const pendingUsers = pendingUsersList.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ?? null,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  res.json({
    partners,
    activeSchools,
    activeOrganisations,
    activeMiradis,
    learnersByTrack,
    peopleStats,
    financeStats,
    sessionReportsMissingCount,
    learnersWithPending,
    organizationsWithPending,
    pendingUsers,
  });
});

// ——— Pending signups (school, organisation, miradi, parent) ———

type PendingSignupPayloadOrg = {
  organisationName: string;
  type: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string | null;
  location?: string;
  passwordHash: string;
};

type PendingSignupPayloadParent = {
  name: string;
  email: string;
  contactPhone?: string | null;
  passwordHash: string;
};

/** GET /v1/admin/pending-signups - list pending signup requests. Admin only. */
router.get("/pending-signups", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const list = await prisma.pendingSignup.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  res.json(list);
});

/** POST /v1/admin/pending-signups/:id/approve - approve signup: create Organisation+User or User, link in DB. Admin only. */
router.post("/pending-signups/:id/approve", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const pending = await prisma.pendingSignup.findUnique({ where: { id } });
  if (!pending) {
    sendError(res, 404, "NOT_FOUND", "Pending signup not found.");
    return;
  }
  if (pending.status !== "pending") {
    sendError(res, 400, "VALIDATION_ERROR", "This signup has already been processed.");
    return;
  }

  const adminId = (req as AuthedRequest).auth?.user.id ?? "";

  if (pending.signupType === "parent") {
    const payload = pending.payload as PendingSignupPayloadParent;
    const existing = await prisma.user.findFirst({
      where: { email: { equals: payload.email, mode: "insensitive" } },
    });
    if (existing) {
      sendError(res, 400, "VALIDATION_ERROR", "A user with this email already exists.");
      return;
    }
    const userId = `u-parent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: payload.name,
        role: "parent",
        email: payload.email,
        contactPhone: payload.contactPhone ?? undefined,
        status: "active",
        membershipStatus: "inactive",
        passwordHash: payload.passwordHash,
      },
    });
    await prisma.pendingSignup.update({
      where: { id },
      data: { status: "approved", reviewedAt: new Date(), reviewedBy: adminId },
    });
    return res.status(200).json({
      approved: true,
      type: "parent",
      message: "Parent account created. They can now log in.",
    });
  }

  if (pending.signupType === "school" || pending.signupType === "organisation" || pending.signupType === "miradi") {
    const payload = pending.payload as PendingSignupPayloadOrg;
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: payload.contactEmail, mode: "insensitive" } },
    });
    if (existingUser) {
      sendError(res, 400, "VALIDATION_ERROR", "A user with this email already exists.");
      return;
    }
    const orgId = `org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await prisma.organisation.create({
      data: {
        id: orgId,
        name: payload.organisationName,
        type: payload.type || "other",
        contactPerson: payload.contactPerson,
        contactEmail: payload.contactEmail,
        contactPhone: payload.contactPhone ?? undefined,
        location: payload.location ?? "",
      },
    });
    const userId = `u-org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: payload.contactPerson,
        role: "organisation",
        email: payload.contactEmail,
        status: "active",
        organizationId: orgId,
        passwordHash: payload.passwordHash,
      },
    });
    await prisma.pendingSignup.update({
      where: { id },
      data: { status: "approved", reviewedAt: new Date(), reviewedBy: adminId },
    });
    return res.status(200).json({
      approved: true,
      type: pending.signupType,
      organisationId: orgId,
      userId,
      message: "Organisation and account created. They can now log in and will be linked to sessions as learners are added.",
    });
  }

  sendError(res, 400, "VALIDATION_ERROR", "Unknown signup type.");
});

/** POST /v1/admin/pending-signups/:id/reject - reject signup request. Admin only. */
router.post("/pending-signups/:id/reject", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as AuthedRequest)) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const pending = await prisma.pendingSignup.findUnique({ where: { id } });
  if (!pending) {
    sendError(res, 404, "NOT_FOUND", "Pending signup not found.");
    return;
  }
  if (pending.status !== "pending") {
    sendError(res, 400, "VALIDATION_ERROR", "This signup has already been processed.");
    return;
  }
  const adminId = (req as AuthedRequest).auth?.user.id ?? "";
  await prisma.pendingSignup.update({
    where: { id },
    data: { status: "rejected", reviewedAt: new Date(), reviewedBy: adminId },
  });
  res.status(200).json({ rejected: true, message: "Signup request rejected." });
});

export default router;

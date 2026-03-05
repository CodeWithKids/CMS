import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireAuth, type AuthLocals } from "../middleware/auth.js";
import { sendError } from "../middleware/error.js";

const router = Router();

const TEAM_ROLES = ["admin", "educator", "finance", "partnerships", "marketing", "social_media", "ld_manager"];
const MIN_PASSWORD_LENGTH = 6;

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
  if (!TEAM_ROLES.includes(role)) {
    sendError(res, 400, "VALIDATION_ERROR", `Role must be one of: ${TEAM_ROLES.join(", ")}.`);
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
  const status = typeof body.status === "string" ? body.status : undefined;
  const role = typeof body.role === "string" ? body.role : undefined;
  const organizationId = body.organizationId !== undefined ? (body.organizationId as string | null) : undefined;

  const data: { status?: string; role?: string; organizationId?: string | null } = {};
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

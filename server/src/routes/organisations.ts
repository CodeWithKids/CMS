import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../middleware/error.js";

const router = Router();

function isAdmin(req: Request & { auth?: { user: { role: string } } }): boolean {
  return req.auth?.user?.role === "admin";
}

/** Admin or Partnership & Communications can update/delete partner orgs. */
function canManagePartners(req: Request & { auth?: { user: { role: string } } }): boolean {
  const role = req.auth?.user?.role;
  return role === "admin" || role === "partnerships";
}

const MIN_PASSWORD_LENGTH = 6;

const SIGNUP_TYPES = ["school", "organisation", "miradi"] as const;

/** POST /v1/organisations/signup - public signup: creates pending request; admin approves to create Organisation + User */
router.post("/signup", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const signupType = SIGNUP_TYPES.includes(body.signupType as (typeof SIGNUP_TYPES)[number])
    ? (body.signupType as (typeof SIGNUP_TYPES)[number])
    : "organisation";
  const organisationName = typeof body.organisationName === "string" ? body.organisationName.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "other";
  const contactPerson = typeof body.contactPerson === "string" ? body.contactPerson.trim() : "";
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() : "";
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : null;
  const location = typeof body.location === "string" ? body.location.trim() : null;
  const password = typeof body.password === "string" ? body.password.trim() : "";

  if (!organisationName || !contactPerson || !contactEmail) {
    sendError(res, 400, "VALIDATION_ERROR", "organisationName, contactPerson, and contactEmail are required.");
    return;
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    sendError(res, 400, "VALIDATION_ERROR", `Password is required and must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: contactEmail, mode: "insensitive" } },
  });
  if (existingUser) {
    sendError(res, 400, "VALIDATION_ERROR", "An account with this email already exists. Use a different email or log in.");
    return;
  }

  const nameLower = organisationName.toLowerCase();
  const existingOrg = await prisma.organisation.findFirst({
    where: { name: { equals: organisationName, mode: "insensitive" } },
  });
  if (existingOrg) {
    sendError(res, 400, "VALIDATION_ERROR", "This school, organisation, or FCP has already been registered. Log in or contact support.");
    return;
  }

  const pendingOrgSignups = await prisma.pendingSignup.findMany({
    where: { status: "pending", signupType: { in: ["school", "organisation", "miradi"] } },
  });
  const sameEmailPending = pendingOrgSignups.some(
    (p) => (p.payload as { contactEmail?: string })?.contactEmail?.toLowerCase() === contactEmail.toLowerCase()
  );
  if (sameEmailPending) {
    sendError(res, 400, "VALIDATION_ERROR", "A signup request with this email is already pending approval.");
    return;
  }
  const sameNamePending = pendingOrgSignups.some(
    (p) => (p.payload as { organisationName?: string })?.organisationName?.toLowerCase() === nameLower
  );
  if (sameNamePending) {
    sendError(res, 400, "VALIDATION_ERROR", "A signup request for this school, organisation, or FCP is already pending approval.");
    return;
  }

  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  await prisma.pendingSignup.create({
    data: {
      id,
      signupType,
      status: "pending",
      payload: {
        organisationName,
        type: type || "other",
        contactPerson,
        contactEmail,
        contactPhone,
        location: location || "",
        passwordHash,
      },
    },
  });

  res.status(201).json({
    id,
    message: "Your signup request has been submitted. An admin will review it shortly. You will be able to log in once your account is approved.",
    accountCreated: false,
  });
});

/** GET /v1/organisations/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const org = await prisma.organisation.findUnique({ where: { id: req.params.id } });
  if (!org) {
    res.status(404).json({ code: "NOT_FOUND", message: "Organisation not found." });
    return;
  }
  res.json(org);
});

/** GET /v1/organisations/:id/learners */
router.get("/:id/learners", async (req: Request, res: Response) => {
  const orgId = req.params.id;
  const org = await prisma.organisation.findUnique({ where: { id: orgId } });
  if (!org) {
    res.status(404).json({ code: "NOT_FOUND", message: "Organisation not found." });
    return;
  }
  const list = await prisma.learner.findMany({ where: { organizationId: orgId } });
  res.json(list);
});

/** GET /v1/organisations/:id/invoices */
router.get("/:id/invoices", async (req: Request, res: Response) => {
  const orgId = req.params.id;
  const org = await prisma.organisation.findUnique({ where: { id: orgId } });
  if (!org) {
    res.status(404).json({ code: "NOT_FOUND", message: "Organisation not found." });
    return;
  }
  const rows = await prisma.financeInvoice.findMany({ where: { organisationId: orgId } });
  res.json(
    rows.map((r) => ({
      ...r,
      status: r.balance <= 0 ? "paid" : r.amountPaid > 0 ? "partially_paid" : r.dueDate < new Date().toISOString().slice(0, 10) ? "overdue" : r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString() ?? null,
    }))
  );
});

/** PATCH /v1/organisations/:id - update partner details (admin or Partnership & Communications). */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!canManagePartners(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin or Partnership & Communications only.");
    return;
  }
  const orgId = req.params.id;
  const org = await prisma.organisation.findUnique({ where: { id: orgId } });
  if (!org) {
    res.status(404).json({ code: "NOT_FOUND", message: "Organisation not found." });
    return;
  }
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const type = typeof body.type === "string" ? body.type.trim() : undefined;
  const contactPerson = typeof body.contactPerson === "string" ? body.contactPerson.trim() : undefined;
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() : undefined;
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : undefined;
  const location = typeof body.location === "string" ? body.location.trim() : undefined;

  const data: { name?: string; type?: string; contactPerson?: string; contactEmail?: string | null; contactPhone?: string | null; location?: string } = {};
  if (name !== undefined) {
    if (!name.trim()) {
      sendError(res, 400, "VALIDATION_ERROR", "Name is required.");
      return;
    }
    data.name = name.trim();
  }
  if (type !== undefined) data.type = type.trim() || org.type;
  if (contactPerson !== undefined) data.contactPerson = contactPerson.trim() || org.contactPerson;
  if (contactEmail !== undefined) data.contactEmail = contactEmail?.trim() || null;
  if (contactPhone !== undefined) data.contactPhone = contactPhone?.trim() || null;
  if (location !== undefined) data.location = location.trim() || org.location;

  if (Object.keys(data).length === 0) {
    res.json(org);
    return;
  }

  const updated = await prisma.organisation.update({
    where: { id: orgId },
    data,
  });
  res.json(updated);
});

/** DELETE /v1/organisations/:id - delete partner (admin or Partnership & Communications). Fails if any learners are linked. */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!canManagePartners(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin or Partnership & Communications only.");
    return;
  }
  const orgId = req.params.id;
  const org = await prisma.organisation.findUnique({ where: { id: orgId } });
  if (!org) {
    res.status(404).json({ code: "NOT_FOUND", message: "Organisation not found." });
    return;
  }

  const learnersLinked = await prisma.learner.count({ where: { organizationId: orgId } });
  if (learnersLinked > 0) {
    sendError(res, 400, "CANNOT_DELETE", "Cannot delete this partner while learners are linked. Reassign or remove learners first.");
    return;
  }

  await prisma.user.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } });
  await prisma.organisation.delete({ where: { id: orgId } });
  res.status(204).send();
});

export default router;

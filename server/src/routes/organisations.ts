import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { sendError } from "../middleware/error.js";

const router = Router();

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

export default router;

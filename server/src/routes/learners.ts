import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../middleware/error.js";

const router = Router();

function isAdmin(req: Request & { auth?: { user: { role: string } } }): boolean {
  return req.auth?.user?.role === "admin";
}

function parseString(val: unknown): string | undefined {
  return typeof val === "string" ? val.trim() || undefined : undefined;
}

/** GET /v1/learners */
router.get("/", async (req: Request, res: Response) => {
  const { enrolmentType, organisationId, status, search, userId } = req.query;

  const where: {
    enrolmentType?: string;
    organizationId?: string;
    status?: string;
    userId?: string;
  } = {};
  if (typeof enrolmentType === "string") where.enrolmentType = enrolmentType;
  if (typeof organisationId === "string") where.organizationId = organisationId;
  if (typeof status === "string") where.status = status;
  if (typeof userId === "string") where.userId = userId;

  let list = await prisma.learner.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const searchStr = typeof search === "string" ? search.trim().toLowerCase() : "";
  if (searchStr) {
    list = list.filter(
      (l) =>
        l.firstName.toLowerCase().includes(searchStr) ||
        l.lastName.toLowerCase().includes(searchStr) ||
        l.school.toLowerCase().includes(searchStr)
    );
  }

  res.json(list);
});

/** POST /v1/learners - admin only. Create a learner. */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const firstName = parseString(body.firstName);
  const lastName = parseString(body.lastName);
  const dateOfBirth = parseString(body.dateOfBirth);
  const school = parseString(body.school);
  const enrolmentType = parseString(body.enrolmentType);
  const programType = parseString(body.programType);
  const membershipStatus = parseString(body.membershipStatus);
  const userId = parseString(body.userId);
  const parentName = parseString(body.parentName);
  const parentPhone = parseString(body.parentPhone);
  const parentEmail = parseString(body.parentEmail);
  const organizationId = parseString(body.organizationId);
  const status = parseString(body.status) ?? "active";
  const gender = parseString(body.gender);
  const joinedAt = parseString(body.joinedAt);

  if (!firstName || !lastName || !dateOfBirth || !school || !enrolmentType || !programType) {
    sendError(res, 400, "VALIDATION_ERROR", "firstName, lastName, dateOfBirth, school, enrolmentType, and programType are required.");
    return;
  }

  const id = `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const learner = await prisma.learner.create({
    data: {
      id,
      firstName,
      lastName,
      dateOfBirth,
      school,
      enrolmentType,
      programType,
      membershipStatus: membershipStatus ?? undefined,
      userId: userId ?? undefined,
      parentName: parentName ?? undefined,
      parentPhone: parentPhone ?? undefined,
      parentEmail: parentEmail ?? undefined,
      organizationId: organizationId ?? undefined,
      status,
      gender: gender ?? undefined,
      joinedAt: joinedAt ?? undefined,
    },
  });
  res.status(201).json(learner);
});

/** PATCH /v1/learners/:id - admin only. Update a learner (e.g. assign to parent via userId). */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.learner.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Learner not found.");
    return;
  }
  const body = req.body ?? {};
  const data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    school?: string;
    enrolmentType?: string;
    programType?: string;
    membershipStatus?: string | null;
    userId?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    parentEmail?: string | null;
    organizationId?: string | null;
    status?: string;
    gender?: string | null;
    joinedAt?: string | null;
  } = {};
  if (body.firstName !== undefined) data.firstName = parseString(body.firstName) ?? existing.firstName;
  if (body.lastName !== undefined) data.lastName = parseString(body.lastName) ?? existing.lastName;
  if (body.dateOfBirth !== undefined) data.dateOfBirth = parseString(body.dateOfBirth) ?? existing.dateOfBirth;
  if (body.school !== undefined) data.school = parseString(body.school) ?? existing.school;
  if (body.enrolmentType !== undefined) data.enrolmentType = parseString(body.enrolmentType) ?? existing.enrolmentType;
  if (body.programType !== undefined) data.programType = parseString(body.programType) ?? existing.programType;
  if (body.membershipStatus !== undefined) data.membershipStatus = parseString(body.membershipStatus) ?? null;
  if (body.userId !== undefined) data.userId = body.userId === null || body.userId === "" ? null : (parseString(body.userId) ?? existing.userId);
  if (body.parentName !== undefined) data.parentName = body.parentName === null || body.parentName === "" ? null : (parseString(body.parentName) ?? existing.parentName);
  if (body.parentPhone !== undefined) data.parentPhone = body.parentPhone === null || body.parentPhone === "" ? null : (parseString(body.parentPhone) ?? existing.parentPhone);
  if (body.parentEmail !== undefined) data.parentEmail = body.parentEmail === null || body.parentEmail === "" ? null : (parseString(body.parentEmail) ?? existing.parentEmail);
  if (body.organizationId !== undefined) data.organizationId = body.organizationId === null || body.organizationId === "" ? null : (parseString(body.organizationId) ?? existing.organizationId);
  if (body.status !== undefined) data.status = parseString(body.status) ?? existing.status;
  if (body.gender !== undefined) data.gender = body.gender === null || body.gender === "" ? null : (parseString(body.gender) ?? existing.gender);
  if (body.joinedAt !== undefined) data.joinedAt = body.joinedAt === null || body.joinedAt === "" ? null : (parseString(body.joinedAt) ?? existing.joinedAt);

  const updated = await prisma.learner.update({ where: { id }, data });
  res.json(updated);
});

/** DELETE /v1/learners/:id - admin only. */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.learner.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Learner not found.");
    return;
  }
  await prisma.learner.delete({ where: { id } });
  res.status(204).send();
});

/** GET /v1/learners/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const learner = await prisma.learner.findUnique({ where: { id: req.params.id } });
  if (!learner) {
    res.status(404).json({ code: "NOT_FOUND", message: "Learner not found." });
    return;
  }
  res.json(learner);
});

/** GET /v1/learners/:id/badges */
router.get("/:id/badges", async (req: Request, res: Response) => {
  const awards = await prisma.learnerBadgeAward.findMany({
    where: { learnerId: req.params.id },
    orderBy: { awardedAt: "desc" },
  });
  res.json(awards);
});

/** POST /v1/learners/:id/badges */
router.post("/:id/badges", async (req: Request, res: Response) => {
  const { badgeId, sessionId, awardedAt, awardedBy } = req.body ?? {};
  if (typeof badgeId !== "string" || !badgeId.trim() || typeof sessionId !== "string" || !sessionId.trim()) {
    res.status(400).json({ code: "BAD_REQUEST", message: "badgeId and sessionId are required." });
    return;
  }
  const id = randomUUID();
  const created = await prisma.learnerBadgeAward.create({
    data: {
      id,
      learnerId: req.params.id,
      sessionId,
      badgeId,
      awardedAt: typeof awardedAt === "string" && awardedAt.trim() ? awardedAt : new Date().toISOString(),
      awardedBy: typeof awardedBy === "string" && awardedBy.trim() ? awardedBy : "system",
    },
  });
  res.status(201).json(created);
});

export default router;

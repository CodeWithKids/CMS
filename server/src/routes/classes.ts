import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../middleware/error.js";

const router = Router();

function isAdmin(req: Request & { auth?: { user: { role: string } } }): boolean {
  return req.auth?.user?.role === "admin";
}

function parseString(val: unknown): string | undefined {
  return typeof val === "string" ? val.trim() : undefined;
}

function parseOptionalNumber(val: unknown): number | null | undefined {
  if (val === null || val === "") return null;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

/** GET /v1/classes */
router.get("/", async (req: Request, res: Response) => {
  const { termId, program, educatorId } = req.query;
  const where: Parameters<typeof prisma.class.findMany>[0]["where"] = {};
  if (typeof termId === "string") where.termId = termId;
  if (typeof program === "string") where.program = program;
  if (typeof educatorId === "string") where.educatorId = educatorId;

  const list = await prisma.class.findMany({ where });
  res.json(list);
});

/** GET /v1/classes/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const cls = await prisma.class.findUnique({ where: { id: req.params.id } });
  if (!cls) {
    res.status(404).json({ code: "NOT_FOUND", message: "Class not found." });
    return;
  }
  res.json(cls);
});

/** POST /v1/classes - admin only. Create a class. */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const program = parseString(body.program);
  const ageGroup = parseString(body.ageGroup);
  const location = parseString(body.location);
  const educatorId = parseString(body.educatorId);
  const termId = parseString(body.termId);
  const learnerIds = Array.isArray(body.learnerIds)
    ? (body.learnerIds as unknown[]).filter((id): id is string => typeof id === "string")
    : [];
  const capacity = parseOptionalNumber(body.capacity);
  const schoolOrOrganisationName = parseString(body.schoolOrOrganisationName) || null;

  if (!name || !program || !ageGroup || !location || !educatorId || !termId) {
    sendError(res, 400, "VALIDATION_ERROR", "name, program, ageGroup, location, educatorId, and termId are required.");
    return;
  }

  const [term, educator] = await Promise.all([
    prisma.term.findUnique({ where: { id: termId } }),
    prisma.user.findUnique({ where: { id: educatorId } }),
  ]);
  if (!term) {
    sendError(res, 400, "VALIDATION_ERROR", "Term not found.");
    return;
  }
  if (!educator || educator.role !== "educator") {
    sendError(res, 400, "VALIDATION_ERROR", "Educator not found or not an educator.");
    return;
  }

  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const cls = await prisma.class.create({
    data: {
      id,
      name,
      program,
      ageGroup,
      location,
      educatorId,
      termId,
      learnerIds,
      capacity: capacity ?? undefined,
      schoolOrOrganisationName: schoolOrOrganisationName ?? undefined,
    },
  });
  res.status(201).json(cls);
});

/** PATCH /v1/classes/:id - admin only. Update class (any fields). */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }

  const id = req.params.id;
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) {
    res.status(404).json({ code: "NOT_FOUND", message: "Class not found." });
    return;
  }

  const body = req.body ?? {};
  const name = parseString(body.name);
  const program = parseString(body.program);
  const ageGroup = parseString(body.ageGroup);
  const location = parseString(body.location);
  const educatorId =
    body.educatorId === null || body.educatorId === ""
      ? null
      : parseString(body.educatorId);
  const termId = parseString(body.termId);
  const learnerIds = Array.isArray(body.learnerIds)
    ? (body.learnerIds as unknown[]).filter((id): id is string => typeof id === "string")
    : undefined;
  const capacity = parseOptionalNumber(body.capacity);
  const schoolOrOrganisationName = body.schoolOrOrganisationName === null || body.schoolOrOrganisationName === ""
    ? null
    : parseString(body.schoolOrOrganisationName);

  const data: {
    name?: string;
    program?: string;
    ageGroup?: string;
    location?: string;
    educatorId?: string | null;
    termId?: string;
    learnerIds?: string[];
    capacity?: number | null;
    schoolOrOrganisationName?: string | null;
  } = {};
  if (name !== undefined) data.name = name;
  if (program !== undefined) data.program = program;
  if (ageGroup !== undefined) data.ageGroup = ageGroup;
  if (location !== undefined) data.location = location;
  if (educatorId !== undefined) data.educatorId = educatorId;
  if (termId !== undefined) data.termId = termId;
  if (learnerIds !== undefined) data.learnerIds = learnerIds;
  if (capacity !== undefined) data.capacity = capacity;
  if (schoolOrOrganisationName !== undefined) data.schoolOrOrganisationName = schoolOrOrganisationName;

  if (Object.keys(data).length === 0) {
    res.json(cls);
    return;
  }

  if (data.educatorId) {
    const educator = await prisma.user.findUnique({ where: { id: data.educatorId } });
    if (!educator || educator.role !== "educator") {
      sendError(res, 400, "VALIDATION_ERROR", "Educator not found or not an educator.");
      return;
    }
  }
  if (data.termId) {
    const term = await prisma.term.findUnique({ where: { id: data.termId } });
    if (!term) {
      sendError(res, 400, "VALIDATION_ERROR", "Term not found.");
      return;
    }
  }

  const updated = await prisma.class.update({
    where: { id },
    data,
  });
  res.json(updated);
});

/** DELETE /v1/classes/:id - admin only. Deletes class and its sessions (and related session reports, attendance). */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) {
    res.status(404).json({ code: "NOT_FOUND", message: "Class not found." });
    return;
  }
  const sessions = await prisma.session.findMany({ where: { classId: id }, select: { id: true } });
  const sessionIds = sessions.map((s) => s.id);
  await prisma.sessionReport.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.session.deleteMany({ where: { classId: id } });
  await prisma.class.delete({ where: { id } });
  res.status(204).send();
});

export default router;

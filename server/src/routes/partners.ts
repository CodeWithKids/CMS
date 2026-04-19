import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../middleware/error.js";

const router = Router();

/** Same as PATCH/DELETE organisations: admin or Partnership & Communications. */
function canViewPartnerLists(req: Request & { auth?: { user: { role: string } } }): boolean {
  const role = req.auth?.user?.role;
  return role === "admin" || role === "partnerships";
}

/** GET /v1/partners/organisations - list school/org/FCP partners from Organisation table. */
router.get("/organisations", requireAuth, async (req: Request, res: Response) => {
  if (!canViewPartnerLists(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin or Partnership & Communications only.");
    return;
  }

  const list = await prisma.organisation.findMany({
    orderBy: { name: "asc" },
  });

  const today = new Date().toISOString().slice(0, 10);
  res.json(
    list.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      contactPerson: o.contactPerson,
      contactEmail: o.contactEmail ?? null,
      contactPhone: o.contactPhone ?? null,
      location: o.location,
      status: "active" as const,
      createdAt: today,
    }))
  );
});

/** GET /v1/partners/parents - list parent partners from User table. */
router.get("/parents", requireAuth, async (req: Request, res: Response) => {
  if (!canViewPartnerLists(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin or Partnership & Communications only.");
    return;
  }

  const list = await prisma.user.findMany({
    where: { role: "parent" },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    list.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email ?? null,
      contactPhone: (u as any).contactPhone ?? null,
      status: (u.status ?? "active") as string,
      createdAt: u.createdAt.toISOString().slice(0, 10),
    }))
  );
});

/** GET /v1/partners/learners - optional: learners plus org/parent linkage. */
router.get("/learners", requireAuth, async (req: Request, res: Response) => {
  if (!canViewPartnerLists(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin or Partnership & Communications only.");
    return;
  }

  const learners = await prisma.learner.findMany({
    orderBy: { lastName: "asc" },
  });

  res.json(
    learners.map((l) => ({
      id: l.id,
      firstName: l.firstName,
      lastName: l.lastName,
      school: l.school,
      programType: l.programType,
      enrollmentType: l.enrollmentType,
      organizationId: l.organizationId ?? null,
      parentEmail: l.parentEmail ?? null,
      parentPhone: l.parentPhone ?? null,
      status: l.status,
    }))
  );
});

export default router;


import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../db.js";

const router = Router();

const STAFF_ROLES = ["admin", "educator", "finance"];

/** GET /v1/educators - list staff (admin, educator, finance). Query: role?, status? */
router.get("/", async (req: Request, res: Response) => {
  const { role, status } = req.query;
  const where: { role: { in: string[] } | string; status?: string } = {
    role: { in: STAFF_ROLES },
  };
  if (typeof role === "string" && STAFF_ROLES.includes(role)) where.role = role;
  if (typeof status === "string") where.status = status;

  const list = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
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

/** GET /v1/educators/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, role: { in: STAFF_ROLES } },
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
  if (!user) {
    res.status(404).json({ code: "NOT_FOUND", message: "Educator not found." });
    return;
  }
  res.json(user);
});

/** GET /v1/educators/:id/badges */
router.get("/:id/badges", async (req: Request, res: Response) => {
  const badges = await prisma.educatorBadge.findMany({
    where: { educatorId: req.params.id },
    orderBy: { earnedAt: "desc" },
  });
  res.json(badges);
});

/** POST /v1/educators/:id/badges */
router.post("/:id/badges", async (req: Request, res: Response) => {
  const { badgeId, trackId, earnedAt } = req.body ?? {};
  if (typeof badgeId !== "string" || !badgeId.trim()) {
    res.status(400).json({ code: "BAD_REQUEST", message: "badgeId is required." });
    return;
  }
  const id = randomUUID();
  const created = await prisma.educatorBadge.create({
    data: {
      id,
      educatorId: req.params.id,
      badgeId,
      trackId: typeof trackId === "string" ? trackId : null,
      earnedAt: typeof earnedAt === "string" && earnedAt.trim() ? earnedAt : new Date().toISOString().slice(0, 10),
    },
  });
  res.status(201).json(created);
});

export default router;

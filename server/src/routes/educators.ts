import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

const STAFF_ROLES = ["admin", "educator", "finance"];

/** GET /v1/educators - list staff (admin, educator, finance). Query: role?, status? */
router.get("/", async (req: Request, res: Response) => {
  const { role, status } = req.query;
  const where: Parameters<typeof prisma.user.findMany>[0]["where"] = {
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

export default router;

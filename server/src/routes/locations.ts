import { Router, type Request, type Response } from "express";
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

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** GET /v1/locations */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await prisma.location.findMany({ orderBy: { name: "asc" } });
  res.json(rows);
});

/** POST /v1/locations - admin only */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const address = parseString(body.address) ?? undefined;
  if (!name) {
    sendError(res, 400, "VALIDATION_ERROR", "name is required.");
    return;
  }
  const id = nextId("loc");
  const row = await prisma.location.create({ data: { id, name, address } });
  res.status(201).json(row);
});

/** PATCH /v1/locations/:id - admin only */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Location not found.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const address = body.address !== undefined ? (parseString(body.address) ?? null) : undefined;
  const data: { name?: string; address?: string | null } = {};
  if (name !== undefined) data.name = name;
  if (address !== undefined) data.address = address;
  if (Object.keys(data).length === 0) {
    res.json(existing);
    return;
  }
  const updated = await prisma.location.update({ where: { id }, data });
  res.json(updated);
});

/** DELETE /v1/locations/:id - admin only */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Location not found.");
    return;
  }
  await prisma.location.delete({ where: { id } });
  res.status(204).send();
});

export default router;

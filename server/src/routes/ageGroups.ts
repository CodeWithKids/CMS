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

function parseOptionalInt(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  const n = typeof val === "number" ? val : parseInt(String(val), 10);
  return Number.isFinite(n) ? n : undefined;
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** GET /v1/age-groups */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await prisma.ageGroup.findMany({ orderBy: { name: "asc" } });
  res.json(rows);
});

/** POST /v1/age-groups - admin only */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const minAge = parseOptionalInt(body.minAge);
  const maxAge = parseOptionalInt(body.maxAge);
  if (!name) {
    sendError(res, 400, "VALIDATION_ERROR", "name is required.");
    return;
  }
  const id = nextId("ag");
  const row = await prisma.ageGroup.create({
    data: { id, name, minAge: minAge ?? undefined, maxAge: maxAge ?? undefined },
  });
  res.status(201).json(row);
});

/** PATCH /v1/age-groups/:id - admin only */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.ageGroup.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Age group not found.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const minAge = body.minAge !== undefined ? parseOptionalInt(body.minAge) : undefined;
  const maxAge = body.maxAge !== undefined ? parseOptionalInt(body.maxAge) : undefined;
  const data: { name?: string; minAge?: number | null; maxAge?: number | null } = {};
  if (name !== undefined) data.name = name;
  if (minAge !== undefined) data.minAge = minAge ?? null;
  if (maxAge !== undefined) data.maxAge = maxAge ?? null;
  if (Object.keys(data).length === 0) {
    res.json(existing);
    return;
  }
  const updated = await prisma.ageGroup.update({ where: { id }, data });
  res.json(updated);
});

/** DELETE /v1/age-groups/:id - admin only */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.ageGroup.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Age group not found.");
    return;
  }
  await prisma.ageGroup.delete({ where: { id } });
  res.status(204).send();
});

export default router;

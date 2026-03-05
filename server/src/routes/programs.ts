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

/** GET /v1/programs */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await prisma.program.findMany({ orderBy: { name: "asc" } });
  res.json(rows);
});

/** POST /v1/programs - admin only */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const description = parseString(body.description) ?? undefined;
  if (!name) {
    sendError(res, 400, "VALIDATION_ERROR", "name is required.");
    return;
  }
  const id = nextId("prog");
  const row = await prisma.program.create({ data: { id, name, description } });
  res.status(201).json(row);
});

/** PATCH /v1/programs/:id - admin only */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Program not found.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const description = body.description !== undefined ? (parseString(body.description) ?? null) : undefined;
  const data: { name?: string; description?: string | null } = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (Object.keys(data).length === 0) {
    res.json(existing);
    return;
  }
  const updated = await prisma.program.update({ where: { id }, data });
  res.json(updated);
});

/** DELETE /v1/programs/:id - admin only */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Program not found.");
    return;
  }
  await prisma.program.delete({ where: { id } });
  res.status(204).send();
});

export default router;

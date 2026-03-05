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

/** GET /v1/terms */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await prisma.term.findMany({ orderBy: { startDate: "asc" } });
  res.json(rows);
});

/** GET /v1/terms/current */
router.get("/current", async (_req: Request, res: Response) => {
  const current = await prisma.term.findFirst({ where: { isCurrent: true } });
  if (!current) {
    res.status(404).json({ code: "NOT_FOUND", message: "No current term." });
    return;
  }
  res.json(current);
});

/** POST /v1/terms - admin only. Create a term. */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const startDate = parseString(body.startDate);
  const endDate = parseString(body.endDate);
  const isCurrent = body.isCurrent === true;

  if (!name || !startDate || !endDate) {
    sendError(res, 400, "VALIDATION_ERROR", "name, startDate, and endDate are required.");
    return;
  }

  if (isCurrent) {
    await prisma.term.updateMany({ data: { isCurrent: false } });
  }

  const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const term = await prisma.term.create({
    data: { id, name, startDate, endDate, isCurrent: isCurrent ?? false },
  });
  res.status(201).json(term);
});

/** PATCH /v1/terms/:id - admin only. Update a term. */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.term.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Term not found.");
    return;
  }
  const body = req.body ?? {};
  const name = parseString(body.name);
  const startDate = parseString(body.startDate);
  const endDate = parseString(body.endDate);
  const isCurrent = body.isCurrent;

  const data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean } = {};
  if (name !== undefined) data.name = name;
  if (startDate !== undefined) data.startDate = startDate;
  if (endDate !== undefined) data.endDate = endDate;
  if (typeof isCurrent === "boolean") {
    data.isCurrent = isCurrent;
    if (isCurrent) await prisma.term.updateMany({ where: { id: { not: id } }, data: { isCurrent: false } });
  }

  if (Object.keys(data).length === 0) {
    res.json(existing);
    return;
  }
  const updated = await prisma.term.update({ where: { id }, data });
  res.json(updated);
});

/** DELETE /v1/terms/:id - admin only. */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!isAdmin(req as Request & { auth?: { user: { role: string } } })) {
    sendError(res, 403, "FORBIDDEN", "Admin only.");
    return;
  }
  const id = req.params.id;
  const existing = await prisma.term.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 404, "NOT_FOUND", "Term not found.");
    return;
  }
  await prisma.term.delete({ where: { id } });
  res.status(204).send();
});

export default router;

import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../middleware/error.js";

const router = Router();

function isAdmin(req: Request & { auth?: { user: { role: string } } }): boolean {
  return req.auth?.user?.role === "admin";
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

/** PATCH /v1/classes/:id - admin only. Used to assign an educator to a class. */
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
  const educatorId =
    body.educatorId === null || body.educatorId === ""
      ? null
      : typeof body.educatorId === "string"
      ? body.educatorId.trim()
      : undefined;

  if (educatorId === undefined) {
    sendError(res, 400, "VALIDATION_ERROR", "educatorId is required in the request body.");
    return;
  }

  if (educatorId) {
    const educator = await prisma.user.findUnique({ where: { id: educatorId } });
    if (!educator || educator.role !== "educator") {
      sendError(res, 400, "VALIDATION_ERROR", "Educator not found or not an educator.");
      return;
    }
  }

  const updated = await prisma.class.update({
    where: { id },
    data: { educatorId },
  });

  res.json(updated);
});

export default router;

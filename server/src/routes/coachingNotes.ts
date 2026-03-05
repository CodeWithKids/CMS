import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

/** GET /v1/coaching-notes?educatorId= */
router.get("/", async (req: Request, res: Response) => {
  const { educatorId } = req.query;
  const where: Parameters<typeof prisma.coachingNote.findMany>[0]["where"] = {};
  if (typeof educatorId === "string") where.educatorId = educatorId;
  const list = await prisma.coachingNote.findMany({
    where,
    orderBy: { date: "desc" },
  });
  res.json(list);
});

/** POST /v1/coaching-notes */
router.post("/", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const educatorId = typeof body.educatorId === "string" ? body.educatorId.trim() : "";
  const authorId = typeof body.authorId === "string" ? body.authorId.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : new Date().toISOString().slice(0, 10);
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!educatorId || !authorId || !text) {
    res.status(400).json({ code: "VALIDATION_ERROR", message: "educatorId, authorId, and text are required." });
    return;
  }
  const created = await prisma.coachingNote.create({
    data: {
      id: typeof body.id === "string" ? body.id : `cn-${Date.now()}`,
      educatorId,
      authorId,
      date,
      text,
      trackRef: typeof body.trackRef === "string" ? body.trackRef : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
    },
  });
  res.status(201).json(created);
});

export default router;


import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

/** GET /v1/lesson-plans/templates */
router.get("/templates", async (_req: Request, res: Response) => {
  const list = await prisma.lessonPlanTemplate.findMany({
    orderBy: [{ learningTrackId: "asc" }, { title: "asc" }],
  });
  res.json(list);
});

/** POST /v1/lesson-plans/templates */
router.post("/templates", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const learningTrackId = typeof body.learningTrackId === "string" ? body.learningTrackId.trim() : "";
  if (!title || !learningTrackId) {
    res.status(400).json({ code: "VALIDATION_ERROR", message: "title and learningTrackId are required." });
    return;
  }
  const created = await prisma.lessonPlanTemplate.create({
    data: {
      id: typeof body.id === "string" ? body.id : `lpt-${Date.now()}`,
      title,
      learningTrackId,
      payload: body.payload ?? {},
      createdById: typeof body.createdById === "string" ? body.createdById : null,
    },
  });
  res.status(201).json(created);
});

/** PATCH /v1/lesson-plans/templates/:id */
router.patch("/templates/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const existing = await prisma.lessonPlanTemplate.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ code: "NOT_FOUND", message: "Template not found." });
    return;
  }
  const body = req.body ?? {};
  const data: Parameters<typeof prisma.lessonPlanTemplate.update>[0]["data"] = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.learningTrackId === "string") data.learningTrackId = body.learningTrackId.trim();
  if (body.payload !== undefined) data.payload = body.payload;
  const updated = await prisma.lessonPlanTemplate.update({ where: { id }, data });
  res.json(updated);
});

/** GET /v1/lesson-plans/instances?sessionId=&educatorId= */
router.get("/instances", async (req: Request, res: Response) => {
  const { sessionId, educatorId } = req.query;
  const where: Parameters<typeof prisma.lessonPlanInstance.findMany>[0]["where"] = {};
  if (typeof sessionId === "string") where.sessionId = sessionId;
  if (typeof educatorId === "string") where.educatorId = educatorId;
  const list = await prisma.lessonPlanInstance.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
  res.json(list);
});

/** POST /v1/lesson-plans/instances */
router.post("/instances", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "draft";
  if (!sessionId) {
    res.status(400).json({ code: "VALIDATION_ERROR", message: "sessionId is required." });
    return;
  }
  const created = await prisma.lessonPlanInstance.create({
    data: {
      id: typeof body.id === "string" ? body.id : `lpi-${Date.now()}`,
      sessionId,
      templateId: typeof body.templateId === "string" ? body.templateId : null,
      status,
      payload: body.payload ?? {},
      educatorId: typeof body.educatorId === "string" ? body.educatorId : null,
    },
  });
  res.status(201).json(created);
});

/** PATCH /v1/lesson-plans/instances/:id */
router.patch("/instances/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const existing = await prisma.lessonPlanInstance.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ code: "NOT_FOUND", message: "Instance not found." });
    return;
  }
  const body = req.body ?? {};
  const data: Parameters<typeof prisma.lessonPlanInstance.update>[0]["data"] = {};
  if (typeof body.status === "string") data.status = body.status.trim();
  if (body.payload !== undefined) data.payload = body.payload;
  if (typeof body.templateId === "string" || body.templateId === null) {
    data.templateId = body.templateId;
  }
  const updated = await prisma.lessonPlanInstance.update({ where: { id }, data });
  res.json(updated);
});

export default router;


import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

/** GET /v1/session-reports - query: dateFrom?, dateTo?, educatorId? */
router.get("/", async (req: Request, res: Response) => {
  const { dateFrom, dateTo, educatorId } = req.query;
  const where: {
    date?: { gte?: string; lte?: string };
    OR?: ({ leadEducatorId: string } | { assistantEducatorIds: { has: string } })[];
  } = {};
  if (typeof dateFrom === "string" && typeof dateTo === "string") where.date = { gte: dateFrom, lte: dateTo };
  else if (typeof dateFrom === "string") where.date = { gte: dateFrom };
  else if (typeof dateTo === "string") where.date = { lte: dateTo };
  if (typeof educatorId === "string") {
    where.OR = [
      { leadEducatorId: educatorId },
      { assistantEducatorIds: { has: educatorId } },
    ];
  }
  const list = await prisma.sessionReport.findMany({
    where,
    orderBy: { date: "desc" },
  });
  res.json(list);
});

/** GET /v1/session-reports/by-session/:sessionId */
router.get("/by-session/:sessionId", async (req: Request, res: Response) => {
  const report = await prisma.sessionReport.findUnique({
    where: { sessionId: req.params.sessionId },
  });
  if (!report) {
    res.status(404).json({ code: "NOT_FOUND", message: "Report not found for this session." });
    return;
  }
  res.json(report);
});

/** GET /v1/session-reports/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const report = await prisma.sessionReport.findUnique({
    where: { id: req.params.id },
  });
  if (!report) {
    res.status(404).json({ code: "NOT_FOUND", message: "Session report not found." });
    return;
  }
  res.json(report);
});

/** POST /v1/session-reports */
router.post("/", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const id = `sr-${body.sessionId ?? "new"}-${Date.now()}`;
  const report = await prisma.sessionReport.create({
    data: {
      id,
      sessionId: body.sessionId,
      status: body.status ?? "draft",
      leadEducatorId: body.leadEducatorId,
      assistantEducatorIds: Array.isArray(body.assistantEducatorIds) ? body.assistantEducatorIds : [],
      date: body.date,
      duration: body.duration ?? "1_hour",
      sessionType: body.sessionType,
      schoolOrOrganizationName: body.schoolOrOrganizationName ?? "",
      totalLearners: Number(body.totalLearners) ?? 0,
      learningTrack: body.learningTrack ?? "",
      durationHours: Number(body.durationHours) ?? 1,
      femaleCount: Number(body.femaleCount) ?? 0,
      maleCount: Number(body.maleCount) ?? 0,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      objectivesMet: body.objectivesMet ?? "yes",
    },
  });
  res.status(201).json(report);
});

/** PATCH /v1/session-reports/:id */
router.patch("/:id", async (req: Request, res: Response) => {
  const report = await prisma.sessionReport.findUnique({ where: { id: req.params.id } });
  if (!report) {
    res.status(404).json({ code: "NOT_FOUND", message: "Session report not found." });
    return;
  }
  const body = req.body ?? {};
  const updated = await prisma.sessionReport.update({
    where: { id: req.params.id },
    data: {
      status: body.status ?? report.status,
      assistantEducatorIds: body.assistantEducatorIds ?? report.assistantEducatorIds,
      date: body.date ?? report.date,
      duration: body.duration ?? report.duration,
      totalLearners: body.totalLearners !== undefined ? Number(body.totalLearners) : report.totalLearners,
      femaleCount: body.femaleCount !== undefined ? Number(body.femaleCount) : report.femaleCount,
      maleCount: body.maleCount !== undefined ? Number(body.maleCount) : report.maleCount,
      highlights: body.highlights ?? report.highlights,
      objectivesMet: body.objectivesMet ?? report.objectivesMet,
    },
  });
  res.json(updated);
});

export default router;

import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

/** GET /v1/sessions */
router.get("/", async (req: Request, res: Response) => {
  const { educatorId, classId, termId, dateFrom, dateTo } = req.query;
  const where: Parameters<typeof prisma.session.findMany>[0]["where"] = {};
  if (typeof classId === "string") where.classId = classId;
  if (typeof termId === "string") where.termId = termId;
  if (typeof dateFrom === "string" && typeof dateTo === "string") {
    where.date = { gte: dateFrom, lte: dateTo };
  } else if (typeof dateFrom === "string") {
    where.date = { gte: dateFrom };
  } else if (typeof dateTo === "string") {
    where.date = { lte: dateTo };
  }

  let list = await prisma.session.findMany({ where, orderBy: [{ date: "asc" }, { startTime: "asc" }] });

  if (typeof educatorId === "string") {
    list = list.filter(
      (s) => s.leadEducatorId === educatorId || s.assistantEducatorIds.includes(educatorId)
    );
  }

  res.json(list);
});

/** GET /v1/sessions/:id/attendance */
router.get("/:id/attendance", async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    res.status(404).json({ code: "NOT_FOUND", message: "Session not found." });
    return;
  }
  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId },
  });
  res.json(
    records.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      learnerId: r.learnerId,
      status: r.status,
      stars: r.stars,
      notes: r.notes,
      markedAt: r.markedAt?.toISOString(),
      markedBy: r.markedBy,
    }))
  );
});

/** PUT /v1/sessions/:id/attendance - body: array of { learnerId, status, stars?, notes? } */
router.put("/:id/attendance", async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    res.status(404).json({ code: "NOT_FOUND", message: "Session not found." });
    return;
  }
  const body = Array.isArray(req.body) ? req.body : [];
  await prisma.attendanceRecord.deleteMany({ where: { sessionId } });
  const seen = new Set<string>();
  for (let i = 0; i < body.length; i++) {
    const row = body[i] as { learnerId?: string; status?: string; stars?: number; notes?: string };
    const learnerId = row?.learnerId;
    if (!learnerId || seen.has(learnerId)) continue;
    seen.add(learnerId);
    await prisma.attendanceRecord.create({
      data: {
        id: `att-${sessionId}-${learnerId}-${Date.now()}-${i}`,
        sessionId,
        learnerId,
        status: row.status ?? "present",
        stars: row.stars ?? null,
        notes: row.notes ?? null,
        markedAt: new Date(),
      },
    });
  }
  const records = await prisma.attendanceRecord.findMany({ where: { sessionId } });
  res.json(
    records.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      learnerId: r.learnerId,
      status: r.status,
      stars: r.stars,
      notes: r.notes,
      markedAt: r.markedAt?.toISOString(),
      markedBy: r.markedBy,
    }))
  );
});

/** GET /v1/sessions/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) {
    res.status(404).json({ code: "NOT_FOUND", message: "Session not found." });
    return;
  }
  res.json(session);
});

export default router;

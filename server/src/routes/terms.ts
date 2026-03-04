import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

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

export default router;

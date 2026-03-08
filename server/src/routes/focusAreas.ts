import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

/** GET /v1/focus-areas – list focus areas with nested tracks (ordered) */
router.get("/", async (_req: Request, res: Response) => {
  const rows = await prisma.focusArea.findMany({
    orderBy: { order: "asc" },
    include: {
      tracks: { orderBy: { order: "asc" } },
    },
  });
  res.json(rows);
});

export default router;

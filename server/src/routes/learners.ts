import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

/** GET /v1/learners */
router.get("/", async (req: Request, res: Response) => {
  const { enrolmentType, organisationId, status, search } = req.query;

  const where: Parameters<typeof prisma.learner.findMany>[0]["where"] = {};
  if (typeof enrolmentType === "string") where.enrolmentType = enrolmentType;
  if (typeof organisationId === "string") where.organizationId = organisationId;
  if (typeof status === "string") where.status = status;

  let list = await prisma.learner.findMany({ where, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });

  const searchStr = typeof search === "string" ? search.trim().toLowerCase() : "";
  if (searchStr) {
    list = list.filter(
      (l) =>
        l.firstName.toLowerCase().includes(searchStr) ||
        l.lastName.toLowerCase().includes(searchStr) ||
        l.school.toLowerCase().includes(searchStr)
    );
  }

  res.json(list);
});

/** GET /v1/learners/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const learner = await prisma.learner.findUnique({ where: { id: req.params.id } });
  if (!learner) {
    res.status(404).json({ code: "NOT_FOUND", message: "Learner not found." });
    return;
  }
  res.json(learner);
});

export default router;

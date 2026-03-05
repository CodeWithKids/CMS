import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { sendError } from "../middleware/error.js";

const router = Router();

/** GET /v1/events?status=&dateFrom=&dateTo= */
router.get("/", async (req: Request, res: Response) => {
  const { status, dateFrom, dateTo } = req.query;
  const where: {
    status?: string;
    startDate?: { gte?: string; lte?: string };
  } = {};
  if (typeof status === "string") where.status = status;
  if (typeof dateFrom === "string" && typeof dateTo === "string") {
    where.startDate = { gte: dateFrom, lte: dateTo };
  } else if (typeof dateFrom === "string") {
    where.startDate = { gte: dateFrom };
  } else if (typeof dateTo === "string") {
    where.startDate = { lte: dateTo };
  }

  const list = await prisma.event.findMany({
    where,
    orderBy: [{ startDate: "asc" }],
  });
  res.json(list);
});

/** GET /v1/events/:slug */
router.get("/:slug", async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { slug: req.params.slug },
  });
  if (!event) {
    res.status(404).json({ code: "NOT_FOUND", message: "Event not found." });
    return;
  }
  res.json(event);
});

/** POST /v1/events */
router.post("/", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const startDate = typeof body.startDate === "string" ? body.startDate.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "DRAFT";

  if (!title || !slug || !startDate || !location) {
    sendError(res, 400, "VALIDATION_ERROR", "title, slug, startDate, and location are required.");
    return;
  }

  const existing = await prisma.event.findUnique({ where: { slug } });
  if (existing) {
    sendError(res, 400, "VALIDATION_ERROR", "An event with this slug already exists.");
    return;
  }

  const tracks = Array.isArray(body.tracks) ? (body.tracks as string[]) : [];
  const created = await prisma.event.create({
    data: {
      id: `evt-${Date.now()}`,
      slug,
      title,
      description: typeof body.description === "string" ? body.description : null,
      startDate,
      endDate: typeof body.endDate === "string" ? body.endDate : null,
      location,
      capacity: typeof body.capacity === "number" ? body.capacity : null,
      price: typeof body.price === "number" ? body.price : null,
      tracks,
      status,
      createdById: typeof body.createdById === "string" ? body.createdById : "system",
    },
  });

  res.status(201).json(created);
});

/** PATCH /v1/events/:slug */
router.patch("/:slug", async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const existing = await prisma.event.findUnique({ where: { slug } });
  if (!existing) {
    res.status(404).json({ code: "NOT_FOUND", message: "Event not found." });
    return;
  }

  const body = req.body ?? {};
  const data: Parameters<typeof prisma.event.update>[0]["data"] = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.startDate === "string") data.startDate = body.startDate.trim();
  if (typeof body.endDate === "string") data.endDate = body.endDate.trim();
  if (typeof body.location === "string") data.location = body.location.trim();
  if (typeof body.capacity === "number") data.capacity = body.capacity;
  if (typeof body.price === "number") data.price = body.price;
  if (typeof body.status === "string") data.status = body.status.trim();
  if (Array.isArray(body.tracks)) data.tracks = body.tracks as string[];
  if (typeof body.slug === "string" && body.slug.trim() && body.slug.trim() !== slug) {
    data.slug = body.slug.trim();
  }

  const updated = await prisma.event.update({
    where: { slug },
    data,
  });

  res.json(updated);
});

export default router;


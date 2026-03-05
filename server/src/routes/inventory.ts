import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";

const router = Router();

/** GET /v1/inventory/items?status=&category=&educatorId= */
router.get("/items", async (req: Request, res: Response) => {
  const { status, category, educatorId } = req.query;
  const where: Parameters<typeof prisma.inventoryItem.findMany>[0]["where"] = {};
  if (typeof status === "string") where.status = status;
  if (typeof category === "string") where.category = category;
  if (typeof educatorId === "string") {
    where.OR = [
      { checkedOutByEducatorId: educatorId },
      { assignedEducatorId: educatorId },
    ];
  }
  const list = await prisma.inventoryItem.findMany({ where, orderBy: { name: "asc" } });
  res.json(list);
});

/** POST /v1/inventory/items */
router.post("/items", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "device";
  const status = typeof body.status === "string" ? body.status.trim() : "available";

  if (!name) {
    res.status(400).json({ code: "VALIDATION_ERROR", message: "name is required." });
    return;
  }

  const created = await prisma.inventoryItem.create({
    data: {
      id: body.id && typeof body.id === "string" ? body.id : `inv-${Date.now()}`,
      name,
      category,
      status,
      serialNumber: typeof body.serialNumber === "string" ? body.serialNumber : null,
      purchasedAt: typeof body.purchasedAt === "string" ? body.purchasedAt : null,
      checkedOutByEducatorId: typeof body.checkedOutByEducatorId === "string" ? body.checkedOutByEducatorId : null,
      assignedEducatorId: typeof body.assignedEducatorId === "string" ? body.assignedEducatorId : null,
      checkedOutAt: typeof body.checkedOutAt === "string" ? body.checkedOutAt : null,
      dueAt: typeof body.dueAt === "string" ? body.dueAt : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    },
  });

  res.status(201).json(created);
});

/** PATCH /v1/inventory/items/:id */
router.patch("/items/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ code: "NOT_FOUND", message: "Inventory item not found." });
    return;
  }

  const body = req.body ?? {};
  const data: Parameters<typeof prisma.inventoryItem.update>[0]["data"] = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.category === "string") data.category = body.category.trim();
  if (typeof body.status === "string") data.status = body.status.trim();
  if (typeof body.serialNumber === "string") data.serialNumber = body.serialNumber;
  if (typeof body.purchasedAt === "string") data.purchasedAt = body.purchasedAt;
  if (typeof body.checkedOutByEducatorId === "string" || body.checkedOutByEducatorId === null) {
    data.checkedOutByEducatorId = body.checkedOutByEducatorId;
  }
  if (typeof body.assignedEducatorId === "string" || body.assignedEducatorId === null) {
    data.assignedEducatorId = body.assignedEducatorId;
  }
  if (typeof body.checkedOutAt === "string" || body.checkedOutAt === null) {
    data.checkedOutAt = body.checkedOutAt;
  }
  if (typeof body.dueAt === "string" || body.dueAt === null) {
    data.dueAt = body.dueAt;
  }
  if (typeof body.notes === "string" || body.notes === null) {
    data.notes = body.notes;
  }

  const updated = await prisma.inventoryItem.update({ where: { id }, data });
  res.json(updated);
});

/** DELETE /v1/inventory/items/:id */
router.delete("/items/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  await prisma.inventoryItem.delete({ where: { id } }).catch(() => {});
  res.status(204).end();
});

export default router;


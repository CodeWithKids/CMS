import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { sendError } from "../middleware/error.js";
import type { FinanceInvoice } from "../types.js";

const router = Router();

function deriveStatus(inv: { balance: number; amountPaid: number; dueDate: string; status: string }): string {
  if (inv.status === "cancelled" || inv.status === "paid") return inv.status;
  if (inv.balance <= 0) return "paid";
  const today = new Date().toISOString().slice(0, 10);
  if (inv.dueDate < today && inv.balance > 0) return "overdue";
  if (inv.amountPaid > 0) return "partially_paid";
  if (inv.status === "draft") return "draft";
  return inv.status;
}

function toInvoiceResponse(row: Awaited<ReturnType<typeof prisma.financeInvoice.findUnique>>): FinanceInvoice | null {
  if (!row) return null;
  return {
    id: row.id,
    payerType: row.payerType as FinanceInvoice["payerType"],
    payerId: row.payerId,
    learnerId: row.learnerId,
    organisationId: row.organisationId,
    termId: row.termId,
    programmeId: row.programmeId,
    trackId: row.trackId,
    grossAmount: row.grossAmount,
    discountAmount: row.discountAmount,
    netAmount: row.netAmount,
    amountPaid: row.amountPaid,
    balance: row.balance,
    currency: row.currency,
    dueDate: row.dueDate,
    issueDate: row.issueDate,
    status: deriveStatus(row) as FinanceInvoice["status"],
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    updatedAt: row.updatedAt?.toISOString() ?? undefined,
    updatedBy: row.updatedBy ?? undefined,
  };
}

/** GET /v1/finance/invoices */
router.get("/invoices", async (req: Request, res: Response) => {
  const { termId, status, payerType, organisationId, learnerId } = req.query;
  const where: {
    termId?: string;
    payerType?: string;
    organisationId?: string;
    learnerId?: string;
  } = {};
  if (typeof termId === "string") where.termId = termId;
  if (typeof payerType === "string") where.payerType = payerType;
  if (typeof organisationId === "string") where.organisationId = organisationId;
  if (typeof learnerId === "string") where.learnerId = learnerId;

  const rows = await prisma.financeInvoice.findMany({ where });
  let list = rows.map((r) => toInvoiceResponse(r)!);
  if (typeof status === "string") list = list.filter((i) => deriveStatus(i) === status);
  res.json(list);
});

/** GET /v1/finance/invoices/:id */
router.get("/invoices/:id", async (req: Request, res: Response) => {
  const row = await prisma.financeInvoice.findUnique({ where: { id: req.params.id } });
  const inv = toInvoiceResponse(row);
  if (!inv) {
    res.status(404).json({ code: "NOT_FOUND", message: "Invoice not found." });
    return;
  }
  res.json(inv);
});

/** GET /v1/finance/invoices/:id/payments */
router.get("/invoices/:id/payments", async (req: Request, res: Response) => {
  const list = await prisma.payment.findMany({
    where: { invoiceId: req.params.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(list.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

/** POST /v1/finance/invoices/:id/payments */
router.post("/invoices/:id/payments", async (req: Request, res: Response) => {
  const invoiceId = req.params.id;
  const inv = await prisma.financeInvoice.findUnique({ where: { id: invoiceId } });
  if (!inv) {
    res.status(404).json({ code: "NOT_FOUND", message: "Invoice not found." });
    return;
  }

  const { amount, method, reference, date, recordedBy } = req.body ?? {};
  const numAmount = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    sendError(res, 400, "VALIDATION_ERROR", "Amount must be a positive number.", { amount: ["Amount is required and must be greater than 0."] });
    return;
  }
  if (numAmount > inv.balance) {
    sendError(res, 422, "AMOUNT_EXCEEDS_BALANCE", "Amount cannot be more than the outstanding balance.", {
      amount: [`Requested amount (${numAmount}) exceeds remaining balance (${inv.balance}).`],
    });
    return;
  }

  const allowedMethods = ["mpesa", "bank_transfer", "cash", "card", "other"];
  const payMethod = typeof method === "string" && allowedMethods.includes(method) ? method : "other";
  const dateStr = typeof date === "string" ? date : new Date().toISOString().slice(0, 10);
  const recorded = typeof recordedBy === "string" ? recordedBy : "system";

  const lastPayment = await prisma.payment.findFirst({ where: { invoiceId }, orderBy: { id: "desc" } });
  const nextNum = lastPayment ? parseInt(lastPayment.id.replace(/\D/g, "") || "0", 10) + 1 : 1;
  const nextId = `pay-${nextNum}`;

  const newAmountPaid = inv.amountPaid + numAmount;
  const newBalance = inv.netAmount - newAmountPaid;

  const newPayment = await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        id: nextId,
        invoiceId,
        amount: numAmount,
        method: payMethod,
        reference: typeof reference === "string" ? reference : null,
        date: dateStr,
        recordedBy: recorded,
        createdAt: new Date(),
      },
    });
    await tx.financeInvoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newBalance <= 0 ? "paid" : "partially_paid",
        updatedAt: new Date(),
        updatedBy: recorded,
      },
    });
    return tx.payment.findUniqueOrThrow({ where: { id: nextId } });
  });

  res.status(201).json({
    ...newPayment,
    createdAt: newPayment.createdAt.toISOString(),
  });
});

/** GET /v1/finance/educator-payments */
router.get("/educator-payments", async (req: Request, res: Response) => {
  const { educatorId, period, status } = req.query;
  const where: {
    educatorId?: string;
    period?: string;
    status?: string;
  } = {};
  if (typeof educatorId === "string") where.educatorId = educatorId;
  if (typeof period === "string") where.period = period;
  if (typeof status === "string") where.status = status;

  const rows = await prisma.financeEducatorPayment.findMany({
    where,
    orderBy: [{ period: "asc" }, { educatorId: "asc" }],
  });
  res.json(
    rows.map((p) => ({
      id: p.id,
      educatorId: p.educatorId,
      period: p.period,
      type: p.type,
      amount: p.amount,
      status: p.status,
      datePaid: p.datePaid,
      notes: p.notes,
    }))
  );
});

export default router;

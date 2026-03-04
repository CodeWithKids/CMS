import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { sendError } from "../middleware/error.js";

const router = Router();
const MIN_PASSWORD_LENGTH = 6;

/** POST /v1/parents/signup - public self-signup: creates pending request; admin approves to create User */
router.post("/signup", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() || null : null;

  if (!name || !email) {
    sendError(res, 400, "VALIDATION_ERROR", "Name and email are required.");
    return;
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    sendError(res, 400, "VALIDATION_ERROR", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }

  if (contactPhone) {
    if (!contactPhone.startsWith("+254")) {
      sendError(res, 400, "VALIDATION_ERROR", "Phone must start with +254 (e.g. +254 712 345 678).");
      return;
    }
    const digitsAfter254 = contactPhone.slice(4).replace(/\D/g, "");
    if (digitsAfter254.length !== 9) {
      sendError(res, 400, "VALIDATION_ERROR", "Enter a valid Kenyan number: +254 followed by 9 digits (e.g. 712 345 678).");
      return;
    }
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    sendError(res, 400, "VALIDATION_ERROR", "An account with this email already exists. Log in or use a different email.");
    return;
  }

  const pendingParents = await prisma.pendingSignup.findMany({
    where: { status: "pending", signupType: "parent" },
  });
  const alreadyPending = pendingParents.some(
    (p) => (p.payload as { email?: string })?.email?.toLowerCase() === email.toLowerCase()
  );
  if (alreadyPending) {
    sendError(res, 400, "VALIDATION_ERROR", "A signup request with this email is already pending approval.");
    return;
  }

  const id = `pending-parent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  await prisma.pendingSignup.create({
    data: {
      id,
      signupType: "parent",
      status: "pending",
      payload: { name, email, contactPhone, passwordHash },
    },
  });

  res.status(201).json({
    id,
    message: "Your signup request has been submitted. An admin will review it shortly. You will be able to log in once your account is approved.",
  });
});

export default router;

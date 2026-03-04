import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { signToken, requireAuth } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { sendError } from "../middleware/error.js";

const router = Router();

/** POST /v1/auth/login */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || typeof email !== "string" || !password) {
    sendError(res, 400, "VALIDATION_ERROR", "Email and password are required.");
    return;
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  const valid =
    user &&
    user.passwordHash &&
    (await bcrypt.compare(password, user.passwordHash).catch(() => false));
  if (!user || !valid) {
    sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    return;
  }

  const appUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email ?? undefined,
    status: user.status ?? undefined,
    organizationId: user.organizationId ?? undefined,
    membershipStatus: user.membershipStatus ?? undefined,
    avatarId: user.avatarId ?? undefined,
  };

  const expiresIn = 3600;
  const accessToken = signToken(appUser, expiresIn);

  res.status(200).json({
    accessToken,
    refreshToken: accessToken,
    expiresIn,
    user: {
      id: appUser.id,
      name: appUser.name,
      role: appUser.role,
      email: appUser.email ?? null,
      status: appUser.status ?? null,
      organizationId: appUser.organizationId ?? null,
      membershipStatus: appUser.membershipStatus ?? null,
      avatarId: appUser.avatarId ?? null,
    },
  });
});

/** GET /v1/auth/me - requires auth */
router.get("/me", requireAuth, (req: Request, res: Response) => {
  const auth = (req as Request & { auth: { user: { id: string; name: string; role: string; email?: string; status?: string; organizationId?: string | null; membershipStatus?: string; avatarId?: string | null } } }).auth;
  const user = auth.user;
  res.status(200).json({
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email ?? null,
    status: user.status ?? null,
    organizationId: user.organizationId ?? null,
    membershipStatus: user.membershipStatus ?? null,
    avatarId: user.avatarId ?? null,
  });
});

/** POST /v1/auth/logout */
router.post("/logout", (_req: Request, res: Response) => {
  res.status(204).send();
});

export default router;

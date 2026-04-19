import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AppUser } from "../types.js";
import { prisma } from "../db.js";
import { fetchProfileRole, verifySupabaseUserAccessToken } from "../supabaseJwt.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "cwk-hub-dev-secret-change-in-production";

export interface JwtPayload {
  sub: string;
  email?: string;
  role: AppUser["role"];
  organizationId?: string | null;
}

function toAppUser(row: { id: string; name: string; role: string; email: string | null; status: string | null; organizationId: string | null; membershipStatus: string | null; avatarId: string | null }): AppUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role as AppUser["role"],
    email: row.email ?? undefined,
    status: (row.status as AppUser["status"]) ?? undefined,
    organizationId: row.organizationId,
    membershipStatus: (row.membershipStatus as AppUser["membershipStatus"]) ?? undefined,
    avatarId: row.avatarId,
  };
}

export function signToken(user: AppUser, expiresInSeconds = 3600): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? null,
    } as JwtPayload,
    JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export interface AuthLocals {
  user: AppUser;
  payload: JwtPayload;
}

/** Attach req.auth with current user when Authorization: Bearer <token> is valid. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Missing or invalid authorization." });
    return;
  }

  const hubPayload = verifyToken(token);
  if (hubPayload) {
    prisma.user
      .findUnique({ where: { id: hubPayload.sub } })
      .then((row) => {
        if (!row) {
          res.status(401).json({ code: "UNAUTHORIZED", message: "User not found." });
          return;
        }
        (req as Request & { auth: AuthLocals }).auth = { user: toAppUser(row), payload: hubPayload };
        next();
      })
      .catch((err) => next(err));
    return;
  }

  /** SPA hybrid: Supabase session access_token + profiles.role (API host needs SUPABASE_* + service role). */
  const supabaseSub = verifySupabaseUserAccessToken(token);
  if (!supabaseSub) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Token expired or invalid." });
    return;
  }

  void (async () => {
    try {
      const role = await fetchProfileRole(supabaseSub);
      if (!role) {
        res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Could not verify account role. Ensure the API has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        });
        return;
      }
      const synthetic: AppUser = {
        id: supabaseSub,
        name: "User",
        role: role as AppUser["role"],
        email: undefined,
        status: "active",
        organizationId: null,
        membershipStatus: undefined,
        avatarId: null,
      };
      const payload: JwtPayload = {
        sub: supabaseSub,
        role: synthetic.role,
        organizationId: null,
      };
      (req as Request & { auth: AuthLocals }).auth = { user: synthetic, payload };
      next();
    } catch (err) {
      next(err);
    }
  })();
}

/** Optional auth: set req.auth if token present, do not 401 if missing. */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    next();
    return;
  }

  prisma.user
    .findUnique({ where: { id: payload.sub } })
    .then((row) => {
      if (row) {
        (req as Request & { auth: AuthLocals }).auth = { user: toAppUser(row), payload };
      }
      next();
    })
    .catch((err) => next(err));
}

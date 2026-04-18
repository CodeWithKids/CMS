import type { Request, Response, NextFunction } from "express";
import type { ApiError } from "../types.js";
import { corsAllowedOriginsListForHeaders } from "../config/corsOrigins.js";

export function sendError(res: Response, status: number, code: string, message: string, details?: Record<string, string[]>): void {
  const body: ApiError = { code, message };
  if (details) body.details = details;
  res.status(status).json(body);
}

const ALLOWED_ORIGINS = corsAllowedOriginsListForHeaders();

function setCorsIfAllowed(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
}

export function errorHandler(req: Request, res: Response, _next: NextFunction, err: unknown): void {
  console.error(err);
  if (res.headersSent) return;
  setCorsIfAllowed(req, res);
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: err instanceof Error ? err.message : "An unexpected error occurred.",
  });
}

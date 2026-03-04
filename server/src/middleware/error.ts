import type { Request, Response, NextFunction } from "express";
import type { ApiError } from "../types.js";

export function sendError(res: Response, status: number, code: string, message: string, details?: Record<string, string[]>): void {
  const body: ApiError = { code, message };
  if (details) body.details = details;
  res.status(status).json(body);
}

export function errorHandler(_req: Request, res: Response, _next: NextFunction, err: unknown): void {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: err instanceof Error ? err.message : "An unexpected error occurred.",
  });
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new ApiError(401, "Unauthorized"));

  try {
    const payload = jwt.verify(header.split(" ")[1], env.jwtAccessSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    next(new ApiError(401, "Token expired or invalid"));
  }
};
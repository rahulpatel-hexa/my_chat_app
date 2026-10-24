import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../services/token.service";

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new ApiError(401, "Unauthorized"));

  try {
    req.userId = verifyAccessToken(header.split(" ")[1]).sub;
    next();
  } catch {
    next(new ApiError(401, "Token expired or invalid"));
  }
};
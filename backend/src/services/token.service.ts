import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Types } from "mongoose";
import { env } from "../config/env";
import { Session } from "../models/Session";

export interface AccessTokenPayload {
  sub: string;
}

export const signAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenExpires as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, env.jwtAccessSecret);
  if (typeof payload === "string" || typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Invalid access token payload.");
  }
  return { sub: payload.sub };
};

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const createSession = async (
  userId: Types.ObjectId,
  meta: { userAgent?: string; ip?: string }
) => {
  const refreshToken = crypto.randomBytes(48).toString("hex"); // random string
  await Session.create({
    userId,
    refreshTokenHash: hash(refreshToken), // DB mein sirf hash
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000),
  });
  return refreshToken;
};

export const rotateSession = async (
  refreshToken: string,
  meta: { userAgent?: string; ip?: string }
) => {
  const nextRefreshToken = crypto.randomBytes(48).toString("hex");
  const now = new Date();
  const session = await Session.findOneAndUpdate(
    {
      refreshTokenHash: hash(refreshToken),
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        refreshTokenHash: hash(nextRefreshToken),
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt: new Date(now.getTime() + env.refreshTokenDays * 24 * 60 * 60 * 1000),
      },
    },
    { new: true }
  );

  return session ? { session, refreshToken: nextRefreshToken } : null;
};

export const revokeSession = async (refreshToken: string) => {
  await Session.updateOne(
    { refreshTokenHash: hash(refreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};
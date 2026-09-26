import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Role } from "../generated/prisma/enums.js";

export interface AuthTokenPayload {
  id: string;
  role: Role;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.id !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    id: decoded.id,
    role: decoded.role as Role,
  };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function calculateRefreshTokenExpiry(
  duration: string = env.JWT_REFRESH_EXPIRES_IN
): Date {
  let ms = 7 * 24 * 60 * 60 * 1000;
  const match = /^(\d+)([dhms])$/.exec(duration);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === "d") ms = val * 24 * 60 * 60 * 1000;
    else if (unit === "h") ms = val * 60 * 60 * 1000;
    else if (unit === "m") ms = val * 60 * 1000;
    else if (unit === "s") ms = val * 1000;
  }
  return new Date(Date.now() + ms);
}
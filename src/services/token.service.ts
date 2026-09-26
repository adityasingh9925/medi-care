import crypto from "crypto";
import type { CookieOptions } from "express";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import {
  calculateRefreshTokenExpiry,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from "../utils/jwt.js";
import type { Role } from "../generated/prisma/enums.js";

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
}

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export async function createRefreshTokenSession(
  userId: string,
  family?: string,
  metadata?: SessionMetadata
) {
  const rawToken = generateRefreshToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = calculateRefreshTokenExpiry();

  const record = await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      family: family ?? crypto.randomUUID(),
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    },
  });

  return {
    refreshToken: rawToken,
    family: record.family,
    expiresAt,
  };
}

export async function rotateRefreshToken(
  rawToken: string,
  metadata?: SessionMetadata
) {
  const tokenHash = hashToken(rawToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      },
    },
  });

  if (!existingToken) {
    throw new AppError(
      401,
      "Invalid refresh token",
      "INVALID_REFRESH_TOKEN"
    );
  }

  // Reuse detection: If token was already revoked, invalidate its entire lineage
  if (existingToken.isRevoked) {
    await prisma.refreshToken.updateMany({
      where: { family: existingToken.family },
      data: { isRevoked: true },
    });

    throw new AppError(
      401,
      "Security alert: Refresh token reuse detected. All sessions in this chain have been revoked.",
      "TOKEN_REUSE_DETECTED"
    );
  }

  // Check expiration
  if (existingToken.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { isRevoked: true },
    });

    throw new AppError(
      401,
      "Refresh token has expired. Please log in again.",
      "REFRESH_TOKEN_EXPIRED"
    );
  }

  // Revoke the presented refresh token
  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { isRevoked: true },
  });

  // Issue new rotated refresh token with the SAME family
  const newRawToken = generateRefreshToken();
  const newTokenHash = hashToken(newRawToken);
  const newExpiresAt = calculateRefreshTokenExpiry();

  await prisma.refreshToken.create({
    data: {
      tokenHash: newTokenHash,
      userId: existingToken.userId,
      family: existingToken.family,
      expiresAt: newExpiresAt,
      userAgent: metadata?.userAgent ?? existingToken.userAgent,
      ipAddress: metadata?.ipAddress ?? existingToken.ipAddress,
    },
  });

  // Sign new access token
  const newAccessToken = signAccessToken({
    id: existingToken.user.id,
    role: existingToken.user.role as Role,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRawToken,
    user: existingToken.user,
  };
}

export async function revokeRefreshToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);

  const result = await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });

  return result.count > 0;
}

export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });

  return result.count;
}

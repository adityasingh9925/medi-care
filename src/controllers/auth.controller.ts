import type { RequestHandler } from "express";
import { prisma } from "../config/db.js";
import {
  comparePassword,
  hashPassword,
} from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import { Role } from "../generated/prisma/enums.js";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  createRefreshTokenSession,
  getRefreshTokenCookieOptions,
  revokeAllUserTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/token.service.js";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new AppError(
        400,
        "Email is already registered",
        "EMAIL_ALREADY_EXISTS"
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullname: fullName,
        phone,
        role: Role.PATIENT,
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    const accessToken = signAccessToken({
      id: user.id,
      role: user.role,
    });

    const refreshSession = await createRefreshTokenSession(user.id, undefined, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshSession.refreshToken,
      getRefreshTokenCookieOptions()
    );

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshSession.refreshToken,
        token: accessToken,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new AppError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }

    const passwordValid = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      throw new AppError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS"
      );
    }

    const accessToken = signAccessToken({
      id: user.id,
      role: user.role,
    });

    const refreshSession = await createRefreshTokenSession(user.id, undefined, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshSession.refreshToken,
      getRefreshTokenCookieOptions()
    );

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshSession.refreshToken,
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const rawToken =
      req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] || req.body?.refreshToken;

    if (!rawToken) {
      throw new AppError(
        401,
        "Refresh token is required",
        "REFRESH_TOKEN_REQUIRED"
      );
    }

    const rotated = await rotateRefreshToken(rawToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      rotated.refreshToken,
      getRefreshTokenCookieOptions()
    );

    res.status(200).json({
      success: true,
      message: "Tokens rotated successfully",
      data: {
        accessToken: rotated.accessToken,
        refreshToken: rotated.refreshToken,
        token: rotated.accessToken,
        user: rotated.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const rawToken =
      req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] || req.body?.refreshToken;

    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      );
    }

    const count = await revokeAllUserTokens(req.user.id);

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      ...getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
      data: {
        revokedSessionsCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
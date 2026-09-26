import { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { Role } from "../generated/prisma/enums.js";

export const authenticate: RequestHandler = (req, _res, next) => {
    try {
        const authorization = req.headers.authorization
           if (!authorization) {
      throw new AppError(
        401,
        "Authentication required",
        "AUTHENTICATION_REQUIRED",
      );
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
        next(
            new AppError(
                401,
                "Invalid authentication token",
                "INVALID_TOKEN",
            ),
        );
        return;
    }
    const payload = verifyAccessToken(token);
    req.user = {
        id: payload.id,
        role: payload.role
    }
    next();
    } catch (error) {
        next(
            new AppError(
                401,
                "Invalid authentication token",
                "INVALID_TOKEN",
            ),
        );
    }
}

export function authorizeRole(
  ...allowedRoles: Role[]
): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new AppError(
          401,
          "Authentication required",
          "AUTHENTICATION_REQUIRED",
        ),
      );

      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          "You do not have permission to access this resource",
          "FORBIDDEN",
        ),
      );

      return;
    }

    next();
  };
}
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../utils/AppError.js";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  phone: z
    .string()
    .trim()
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, "Refresh token cannot be empty")
    .optional(),
});

export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
  new AppError(
    400,
    result.error.issues
      .map((issue) => issue.message)
      .join(", "),
    "VALIDATION_ERROR",
  ),
      );

      return;
    }

    req.body = result.data;

    next();
  };
}
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

export const doctorProfileSchema = z
  .object({
    specialization: z
      .string()
      .trim()
      .min(2, "Specialization must be at least 2 characters"),

    experienceYears: z
      .number()
      .int("Experience must be a whole number")
      .nonnegative("Experience cannot be negative"),

    consultationFees: z
      .number()
      .positive("Consultation fees must be greater than 0")
      .optional(),

    consultationFee: z
      .number()
      .positive("Consultation fees must be greater than 0")
      .optional(),

    isHomeVisitAvailable: z.boolean().default(false),
  })
  .refine(
    (data) =>
      data.consultationFees !== undefined || data.consultationFee !== undefined,
    {
      message: "Consultation fees is required and must be greater than 0",
      path: ["consultationFees"],
    },
  )
  .transform((data) => {
    const fee = (data.consultationFees ?? data.consultationFee)!;
    return {
      specialization: data.specialization,
      experienceYears: data.experienceYears,
      consultationFees: fee,
      consultationFee: fee,
      isHomeVisitAvailable: data.isHomeVisitAvailable,
    };
  });

export const timeSlotSchema = z
  .object({
    dayOfWeek: z
      .number()
      .int("Day of week must be a whole number")
      .min(0, "Day of week must be between 0 and 6")
      .max(6, "Day of week mus  t be between 0 and 6"),

    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Start time must be in HH:mm format",
      ),

    endTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "End time must be in HH:mm format",
      ),
  })
  .refine(
    (data) => data.startTime < data.endTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

  export const createMedicalRecordSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),

  title: z
    .string()
    .trim()
    .min(1, "Title is required"),

  fileUrl: z
    .string()
    .trim()
    .optional(),

  aiSummary: z
    .string()
    .trim()
    .optional(),
});

export const patientIdParamsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
}); 
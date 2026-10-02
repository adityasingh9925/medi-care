import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const createMedicalRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        "Authentication required",
        "AUTHENTICATION_REQUIRED",
      );
    }

    const { patientId, title, fileUrl, aiSummary } = req.body;

    if (
      req.user.role !== "PATIENT" &&
      req.user.role !== "DOCTOR"
    ) {
      throw new AppError(
        403,
        "You do not have permission to create medical records",
        "FORBIDDEN",
      );
    }

    if (
      req.user.role === "PATIENT" &&
      req.user.id !== patientId
    ) {
      throw new AppError(
        403,
        "You can only create medical records for yourself",
        "FORBIDDEN",
      );
    }

    const patient = await prisma.user.findUnique({
      where: {
        id: patientId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!patient) {
      throw new AppError(
        404,
        "Patient not found",
        "PATIENT_NOT_FOUND",
      );
    }

    if (patient.role !== "PATIENT") {
      throw new AppError(
        400,
        "Medical record can only belong to a patient",
        "INVALID_PATIENT",
      );
    }

    const medicalRecord =
      await prisma.medicalRecord.create({
        data: {
          patientId,
          title,
          fileUrl,
          aiSummary,
        },
        select: {
          id: true,
          patientId: true,
          title: true,
          fileUrl: true,
          aiSummary: true,
          createdAt: true,
        },
      });

    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: {
        medicalRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getPatientMedicalRecords = async (
  req: Request<{ patientId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        "Authentication required",
        "AUTHENTICATION_REQUIRED",
      );
    }

    const { patientId } = req.params;

    if (
      req.user.role !== "PATIENT" &&
      req.user.role !== "DOCTOR"
    ) {
      throw new AppError(
        403,
        "You do not have permission to access medical records",
        "FORBIDDEN",
      );
    }

    if (
      req.user.role === "PATIENT" &&
      req.user.id !== patientId
    ) {
      throw new AppError(
        403,
        "You can only access your own medical records",
        "FORBIDDEN",
      );
    }

    const patient = await prisma.user.findUnique({
      where: {
        id: patientId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!patient) {
      throw new AppError(
        404,
        "Patient not found",
        "PATIENT_NOT_FOUND",
      );
    }

    if (patient.role !== "PATIENT") {
      throw new AppError(
        400,
        "Requested user is not a patient",
        "INVALID_PATIENT",
      );
    }

    const medicalRecords =
      await prisma.medicalRecord.findMany({
        where: {
          patientId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          patientId: true,
          title: true,
          fileUrl: true,
          aiSummary: true,
          createdAt: true,
        },
      });

    res.status(200).json({
      success: true,
      data: {
        medicalRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};
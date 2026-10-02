import type { Request, Response, NextFunction } from "express";

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

import {
  createDailyMeetingToken,
  createDailyRoom,
} from "../services/daily.service.js";

export const joinConsultation = async (
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

    const { appointmentId } = req.body;

    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id: appointmentId,
        },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          type: true,
          scheduledAt: true,
          status: true,

          patient: {
            select: {
              fullname: true,
            },
          },

          doctor: {
            select: {
              fullname: true,
            },
          },

          consultationRoom: {
            select: {
              id: true,
              appointmentId: true,
              roomName: true,
              roomUrl: true,
              isActive: true,
            },
          },
        },
      });

    if (!appointment) {
      throw new AppError(
        404,
        "Appointment not found",
        "APPOINTMENT_NOT_FOUND",
      );
    }

    if (appointment.type !== "TELEHEALTH") {
      throw new AppError(
        400,
        "This appointment is not a telehealth appointment",
        "NOT_TELEHEALTH_APPOINTMENT",
      );
    }

    const isPatient =
      req.user.id === appointment.patientId;

    const isDoctor =
      req.user.id === appointment.doctorId;

    if (!isPatient && !isDoctor) {
      throw new AppError(
        403,
        "You are not a participant of this appointment",
        "FORBIDDEN",
      );
    }

    if (appointment.status === "CANCELLED") {
      throw new AppError(
        400,
        "Cancelled appointments cannot be joined",
        "APPOINTMENT_CANCELLED",
      );
    }

    if (appointment.status === "COMPLETED") {
      throw new AppError(
        400,
        "This appointment has already been completed",
        "APPOINTMENT_COMPLETED",
      );
    }

    let room = appointment.consultationRoom;

    if (!room) {
      const roomName =
        `consultation-${appointment.id}`;

      const dailyRoom = await createDailyRoom(
        roomName,
        appointment.scheduledAt,
      );

      try {
        room = await prisma.consultationRoom.create({
          data: {
            appointmentId: appointment.id,
            roomName: dailyRoom.roomName,
            roomUrl: dailyRoom.roomUrl,
            isActive: true,
          },
          select: {
            id: true,
            appointmentId: true,
            roomName: true,
            roomUrl: true,
            isActive: true,
          },
        });
      } catch (error) {
        const existingRoom =
          await prisma.consultationRoom.findUnique({
            where: {
              appointmentId: appointment.id,
            },
            select: {
              id: true,
              appointmentId: true,
              roomName: true,
              roomUrl: true,
              isActive: true,
            },
          });

        if (!existingRoom) {
          throw error;
        }

        room = existingRoom;
      }
    }

    if (!room.isActive) {
      throw new AppError(
        400,
        "Consultation room is no longer active",
        "CONSULTATION_ROOM_INACTIVE",
      );
    }

    const userName = isDoctor
      ? appointment.doctor.fullname
      : appointment.patient.fullname;

    const token =
      await createDailyMeetingToken(
        room.roomName,
        req.user.id,
        userName,
        appointment.scheduledAt,
      );

    res.status(200).json({
      success: true,
      message: "Consultation room access granted",
      data: {
        roomUrl: room.roomUrl,
        roomName: room.roomName,
        token,
      },
    });
  } catch (error) {
    if (axiosError(error)) {
      return next(
        new AppError(
          502,
          "Unable to communicate with Daily video service",
          "DAILY_API_ERROR",
        ),
      );
    }

    next(error);
  }
};

const axiosError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error
  );
};
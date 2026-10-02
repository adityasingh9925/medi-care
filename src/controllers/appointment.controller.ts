import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/db.js";

export const createAppointment = async (
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

        const {
      doctorId,
      timeSlotId,
      type,
      scheduledAt,
      address,
      reason,
    } = req.body;

    const patientId = req.user.id;

    const appointment = await prisma.$transaction(
        async (tx) => {
             const doctor = await tx.user.findUnique({
          where: {
            id: doctorId,
          },
          select: {
            id: true,
            role: true,
            doctorProfile: {
              select: {
                id: true,
              },
            },
          },
        });
        
        if(!doctor || doctor.role !== "DOCTOR"){
               throw new AppError(
            404,
            "Doctor not found",
            "DOCTOR_NOT_FOUND",
          );
        }
           if (!doctor.doctorProfile) {
          throw new AppError(
            404,
            "Doctor profile not found",
            "DOCTOR_PROFILE_NOT_FOUND",
          );
        }

              const timeSlot = await tx.timeSlot.findUnique({
          where: {
            id: timeSlotId,
          },
        });

                if (!timeSlot) {
          throw new AppError(
            404,
            "Time slot not found",
            "TIME_SLOT_NOT_FOUND",
          );
        }
         if (timeSlot.doctorId !== doctor.doctorProfile.id) {
          throw new AppError(
            400,
            "Time slot does not belong to this doctor",
            "INVALID_TIME_SLOT",
          );
        }
           if (timeSlot.isBooked) {
          throw new AppError(
            409,
            "This time slot is already booked",
            "TIME_SLOT_ALREADY_BOOKED",
          );
        }

              const updatedSlot = await tx.timeSlot.updateMany({
          where: {
            id: timeSlotId,
            doctorId: doctor.doctorProfile.id,
            isBooked: false,
          },
          data: {
            isBooked: true,
          },
        });

               if (updatedSlot.count !== 1) {
          throw new AppError(
            409,
            "This time slot is no longer available",
            "TIME_SLOT_ALREADY_BOOKED",
          );
        }
         const createdAppointment =
          await tx.appointment.create({
            data: {
              patientId,
              doctorId,
              timeSlotId,
              type,
              scheduledAt,
              address,
              reason,
            },
            select: {
              id: true,
              patientId: true,
              doctorId: true,
              timeSlotId: true,
              type: true,
              status: true,
              scheduledAt: true,
              address: true,
              reason: true,
              createdAt: true,
            },
          });

        return createdAppointment;
      },
    );

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: {
        appointment,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getMyAppointments = async (
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
    
        const where =
      req.user.role === "PATIENT"
        ? {
            patientId: req.user.id,
          }
        : req.user.role === "DOCTOR"
          ? {
              doctorId: req.user.id,
            }
          : {};

           const appointments =
      await prisma.appointment.findMany({
        where,
        orderBy: {
          scheduledAt: "asc",
        },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          timeSlotId: true,
          type: true,
          status: true,
          scheduledAt: true,
          address: true,
          reason: true,
          createdAt: true,

          patient: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phone: true,
            },
          },

          doctor: {
            select: {
              id: true,
              fullname: true,
              email: true,
              phone: true,
              doctorProfile: {
                select: {
                  specialization: true,
                  experienceYears: true,
                  consultationFees: true,
                },
              },
            },
          },

          timeSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              isBooked: true,
            },
          },
        },
      });

    res.status(200).json({
      success: true,
      data: {
        appointments,
      },
    });
} catch (error) {
    next(error);
}
}

export const updateAppointmentStatus = async (
  req: Request<{ id: string }>,
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

    const { id } = req.params;
    const { status } = req.body;

    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          timeSlotId: true,
          status: true,
        },
      });

    if (!appointment) {
      throw new AppError(
        404,
        "Appointment not found",
        "APPOINTMENT_NOT_FOUND",
      );
    }

    const isPatient =
      req.user.role === "PATIENT" &&
      appointment.patientId === req.user.id;

    const isDoctor =
      req.user.role === "DOCTOR" &&
      appointment.doctorId === req.user.id;

    if (!isPatient && !isDoctor) {
      throw new AppError(
        403,
        "You can only modify your own appointments",
        "FORBIDDEN",
      );
    }

    const updatedAppointment =
      await prisma.$transaction(async (tx) => {
        if (status === "CANCELLED") {
          await tx.timeSlot.updateMany({
            where: {
              id: appointment.timeSlotId,
            },
            data: {
              isBooked: false,
            },
          });
        }

        if (
          appointment.status === "CANCELLED" &&
          status !== "CANCELLED"
        ) {
          const slot = await tx.timeSlot.updateMany({
            where: {
              id: appointment.timeSlotId,
              isBooked: false,
            },
            data: {
              isBooked: true,
            },
          });

          if (slot.count !== 1) {
            throw new AppError(
              409,
              "The original time slot is no longer available",
              "TIME_SLOT_NO_LONGER_AVAILABLE",
            );
          }
        }

        return tx.appointment.update({
          where: {
            id,
          },
          data: {
            status,
          },
          select: {
            id: true,
            patientId: true,
            doctorId: true,
            timeSlotId: true,
            type: true,
            status: true,
            scheduledAt: true,
            address: true,
            reason: true,
            createdAt: true,
          },
        });
      });

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: {
        appointment: updatedAppointment,
      },
    });
    } catch (error) {
      next(error);
    }
  };
import { RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/db.js";

 export const upsertDoctorProfile: RequestHandler = async(req, res, next) => {
    try {
        if(!req.user){
                throw new AppError(
        401,
        "Authentication required",
        "AUTHENTICATION_REQUIRED",
      );
    }

        const {
      specialization,
      experienceYears,
      consultationFees,
      isHomeVisitAvailable,
    } = req.body;
    const user = await prisma.user.findUnique({
        where : {
            id : req.user.id,
        },
        select: {
            id: true,
            role: true  
        }
        
    })

       if (!user) {
      throw new AppError(
        404,
        "User not found",
        "USER_NOT_FOUND",
      );
    }
 const profile = await prisma.doctorProfile.upsert({
    where: {
        userId: req.user.id
    },
     create: {
        userId: req.user.id,
        specialization,
        experienceYears,
        consultationFees,
        isHomeVisitAvailable,
      },

      update: {
        specialization,
        experienceYears,
        consultationFees,
        isHomeVisitAvailable,
      },

      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
            phone: true,
            role: true,
          },
        },
    }
 })
            res.status(200).json({
      success: true,
      data: {
        profile,
      },
    });
    } catch (error) {
        next(error)
    }
 }


 export const getDoctors: RequestHandler = async (req, res, next) => {
    try {
          const specialization =
      typeof req.query.specialization === "string"
        ? req.query.specialization.trim()
        : undefined;

    const homeVisit =
      typeof req.query.homeVisit === "string"
        ? req.query.homeVisit
        : undefined;

    const isHomeVisitAvailable =
      homeVisit === undefined
        ? undefined
        : homeVisit === "true";

    const doctors = await prisma.doctorProfile.findMany({
      where: {
        ...(specialization
          ? {
              specialization: {
                contains: specialization,
                mode: "insensitive",
              },
            }
          : {}),

        ...(isHomeVisitAvailable !== undefined
          ? {
              isHomeVisitAvailable,
            }
          : {}),
      },

      include: {
        user: {
          select: {
            fullname: true,
            email: true,
            phone: true,
          },
        },

        availability: {
          where: {
            isBooked: false,
          },
          orderBy: [
            {
              dayOfWeek: "asc",
            },
            {
              startTime: "asc",
            },
          ],
        },
      },

      orderBy: {
        specialization: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        doctors,
      },
    });
    } catch (error) {
        next(error)
    }
 }

 export const createTimeSlot: RequestHandler = async (req, res, next) => {
          try {
    if (!req.user) {
      throw new AppError(
        401,
        "Authentication required",
        "AUTHENTICATION_REQUIRED",
      );
    }
      const {
      dayOfWeek,
      startTime,
      endTime,
    } = req.body;

        const doctorProfile =
      await prisma.doctorProfile.findUnique({
        where: {
          userId: req.user.id,
        },
      });

          if (!doctorProfile) {
      throw new AppError(
        404,
        "Doctor profile not found. Create your profile first.",
        "DOCTOR_PROFILE_NOT_FOUND",
      );
    }
        const existingSlot =
      await prisma.timeSlot.findFirst({
        where: {
          doctorId: doctorProfile.id,
          dayOfWeek,
          startTime,
          endTime,
        },
      });

          if (existingSlot) {
      throw new AppError(
        400,
        "This time slot already exists",
        "TIME_SLOT_ALREADY_EXISTS",
      );
    }
        const slot = await prisma.timeSlot.create({
      data: {
        doctorId: doctorProfile.id,
        dayOfWeek,
        startTime,
        endTime,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        slot,
      },
    });
    } catch (error) {
        next(error)
    }
 };

 export const getDoctorSlots: RequestHandler<{ id: string }> = async ( req, res, next ) => {
    try {
     const { id } = req.params;

    const doctorProfile =
      await prisma.doctorProfile.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          specialization: true,
          availability: {
            where: {
              isBooked: false,
            },

            orderBy: [
              {
                dayOfWeek: "asc",
              },
              {
                startTime: "asc",
              },
            ],
          },
        },
      });

    if (!doctorProfile) {
      throw new AppError(
        404,
        "Doctor profile not found",
        "DOCTOR_PROFILE_NOT_FOUND",
      );
    }

    res.status(200).json({
      success: true,
      data: {
        doctor: {
          id: doctorProfile.id,
          specialization: doctorProfile.specialization,
        },
        slots: doctorProfile.availability,
      },
    });
        
    } catch (error) {
        next(error)
    }
 }
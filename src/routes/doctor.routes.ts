import { Router } from "express";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { doctorProfileSchema, timeSlotSchema, validateBody } from "../middlewares/validate.js";
import { createTimeSlot, getDoctors, getDoctorSlots, upsertDoctorProfile } from "../controllers/doctor.controller.js";

const router = Router()

router.post("/profile", authenticate, authorizeRole("DOCTOR"),validateBody(doctorProfileSchema), upsertDoctorProfile)

router.get('/',getDoctors)

router.post("/slots", authenticate, authorizeRole("DOCTOR"), validateBody(timeSlotSchema), createTimeSlot)

router.get("/:id/slots", getDoctorSlots)

export default router
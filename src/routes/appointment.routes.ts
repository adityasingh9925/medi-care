import { Router } from "express";

import {
  createAppointment,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";

import { authenticate } from "../middlewares/auth.js";

import {
  validateBody,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "../middlewares/validate.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validateBody(createAppointmentSchema),
  createAppointment,
);

router.get(
  "/my",
  authenticate,
  getMyAppointments,
);

router.patch(
  "/:id/status",
  authenticate,
  validateBody(updateAppointmentStatusSchema),
  updateAppointmentStatus,
);

export default router;
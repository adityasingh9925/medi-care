import { Router } from "express";

import {
  joinConsultation,
} from "../controllers/consultation.controller.js";

import { authenticate } from "../middlewares/auth.js";

import {
  validateBody,
  joinConsultationSchema,
} from "../middlewares/validate.js";

const router = Router();

router.post(
  "/join",
  authenticate,
  validateBody(joinConsultationSchema),
  joinConsultation,
);

export default router;
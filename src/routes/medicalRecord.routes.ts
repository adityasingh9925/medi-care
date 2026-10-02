import { Router } from "express";

import {
  createMedicalRecord,
  getPatientMedicalRecords,
} from "../controllers/medicalRecord.controller.js";

import { authenticate } from "../middlewares/auth.js";

import {
  validateBody,
  createMedicalRecordSchema,
  patientIdParamsSchema,
} from "../middlewares/validate.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validateBody(createMedicalRecordSchema),
  createMedicalRecord,
);

router.get(
  "/patient/:patientId",
  authenticate,
  validateBody(patientIdParamsSchema),
  getPatientMedicalRecords,
);

export default router;  
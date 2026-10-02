import { Router } from "express";
import authRoutes from "./auth.routes.js";
import doctorRoutes from "./doctor.routes.js"
import medicalRecordRoutes from "./medicalRecord.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import consultationRoutes from "./consultation.routes.js";
const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes)
router.use("/medical-records", medicalRecordRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/consultations", consultationRoutes);
export default router;
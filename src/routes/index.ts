import { Router } from "express";
import authRoutes from "./auth.routes.js";
import doctorRoutes from "./doctor.routes.js"
import medicalRecordRoutes from "./medicalRecord.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes)
router.use("/medical-records", medicalRecordRoutes);
export default router;
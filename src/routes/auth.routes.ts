import { Router } from "express";
import {
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.js";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  validateBody,
} from "../middlewares/validate.js";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  register
);

router.post(
  "/login",
  validateBody(loginSchema),
  login
);

router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  refresh
);

router.post(
  "/logout",
  validateBody(refreshTokenSchema),
  logout
);

router.post(
  "/logout-all",
  authenticate,
  logoutAll
);

router.get(
  "/me",
  authenticate,
  me
);

export default router;
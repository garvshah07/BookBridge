import express from "express";
import {
  createUserController,
  forgotPasswordUserController,
  loginUserController,
  resetPasswordController,
  verifyOtpController,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", createUserController);
router.post("/login", loginUserController);
router.post("/forgot-password", forgotPasswordUserController);
router.post("/verify-otp", verifyOtpController);
router.post("/reset-password", resetPasswordController);

export default router;

import express from "express";
import {
  createUserController,
  forgotPasswordUserController,
  loginUserController,
  resetPasswordController,
  verifyOtpController,
  UserByIdController,
  updateProfileController,
  deleteUserByIdController,
  getAllUsersController
} from "../controllers/user.controller.js";

import { upload } from "../middleware/cloudinaryUpload.js";

const router = express.Router();

router.post("/register", createUserController);
router.post("/login", loginUserController);
router.post("/forgot-password", forgotPasswordUserController);
router.post("/verify-otp", verifyOtpController);
router.post("/reset-password", resetPasswordController);
router.get("/:id", UserByIdController);
router.put(
  "/update-profile/:id",
  upload.single("image"),   // 👈 same field name
  updateProfileController
);
router.delete("/delete/:id", deleteUserByIdController);
router.get("/users", getAllUsersController);

export default router;

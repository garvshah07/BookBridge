import express from "express";
import {
  createUserController,
  loginUserController,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", createUserController);
router.post("/login", loginUserController);

export default router;

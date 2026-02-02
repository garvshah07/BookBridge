import express from "express";
import {
  uploadFileController,
  getAllUploadFileByIdController,
} from "../controllers/uploadfile.controller.js";

import upload from "../config/multer.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFileController);
router.post("/files", getAllUploadFileByIdController);

export default router;

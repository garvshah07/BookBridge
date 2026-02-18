import express from "express";
import {
  uploadFileController,
  getAllUploadFileByIdController,
  translatedFileController,
  pdfToAudioController,
} from "../controllers/uploadfile.controller.js";

import upload from "../config/multer.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFileController);
router.get("/files", getAllUploadFileByIdController);
router.post("/translate/text", translatedFileController);
router.post("/translate/audio", pdfToAudioController);

export default router;

import express from "express";
import {
  uploadFileController,
  getAllUploadFileByIdController,
  translatedFileController,
  pdfToAudioController,
  pdfTextToSummaryController,
  pdfToQuizController,
  getFileOutputsController,
  getOutputByIdController
} from "../controllers/uploadfile.controller.js";

import upload from "../config/multer.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFileController);
router.get("/files", getAllUploadFileByIdController);
router.post("/translate/text", translatedFileController);
router.post("/translate/audio", pdfToAudioController);
router.post("/translate/summary", pdfTextToSummaryController);
router.post("/translate/quiz", pdfToQuizController);
router.get("/file/:fileId/outputs", getFileOutputsController);
router.get("/output/:outputId", getOutputByIdController);

export default router;

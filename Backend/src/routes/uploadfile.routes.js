import express from "express";
import {
  uploadFileController,
  getAllUploadFileByIdController,
  translatedFileController,
  pdfToAudioController,
  pdfTextToSummaryController,
  pdfToQuizController,
  getFileOutputsController,
  getOutputByIdController,
  getAllFileOutputsAdminController,
  deleteFileOutputByIdController,
  deleteFileByIdController,
  getAllFilesController
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
router.get("/admin/outputs", getAllFileOutputsAdminController);
router.get("/output/:outputId", getOutputByIdController);
router.delete("/output/:outputId", deleteFileOutputByIdController);
router.post("/delete/:fileid", deleteFileByIdController);
router.get("/", getAllFilesController);

export default router;

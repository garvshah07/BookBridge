import {
  UploadFile,
  GetAllUploadFileById,
  TranslatedTextToPdf,
  PdfToAudioService,
  pdfTextToSummary,
  pdfToQuizService
} from "../services/uploadfile.service.js";


import pool from  "../config/db.js";





export const getFileOutputsController = async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await pool.query(
      `SELECT output_id, operation_type, language, created_at
       FROM file_outputs
       WHERE file_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [fileId, req.user.userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


export const getOutputByIdController = async (req, res) => {
  try {
    const { outputId } = req.params;

    const result = await pool.query(
      `SELECT * FROM file_outputs WHERE output_id=$1`,
      [outputId]
    );

    const output = result.rows[0];

    if (!output) {
      return res.status(404).json({ message: "Not found" });
    }

    // PDF / AUDIO
    if (output.output_data) {
      res.send(output.output_data);
    } else {
      res.json({
        success: true,
        data: output.output_json
      });
    }

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const uploadFileController = async (req, res) => {
  try {

    const fileData = await UploadFile(req.file, req.user);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: fileData,
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

export const getAllUploadFileByIdController = async (req, res) => {
  try {

    const files = await GetAllUploadFileById(req.user);

    res.status(200).json({
      success: true,
      data: files,
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

export const translatedFileController = async (req, res) => {
  try {

    const { fileId, selectedLanguage } = req.body;

    const pdfBuffer = await TranslatedTextToPdf(fileId, selectedLanguage);

    await pool.query(
  `INSERT INTO file_outputs (file_id, user_id, operation_type, language, output_data)
   VALUES ($1, $2, $3, $4, $5)`,
  [fileId, req.user.userId, "translate", selectedLanguage, pdfBuffer]
);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="translated.pdf"',
    });

    res.send(pdfBuffer);

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

export const pdfToAudioController = async (req, res) => {
  try {

    const { fileId, selectedLanguage } = req.body;

    const audio = await PdfToAudioService(fileId, selectedLanguage);

    await pool.query(
  `INSERT INTO file_outputs (file_id, user_id, operation_type, language, output_data)
   VALUES ($1, $2, $3, $4, $5)`,
  [fileId, req.user.userId, "audio", selectedLanguage, audio]
);

    res.set({
      "Content-Type": "audio/wav",
      "Content-Disposition": 'attachment; filename="document_audio.wav"',
    });

    res.send(audio);

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};


export const pdfTextToSummaryController = async (req, res) => {
  try {

    const { fileId, selectedLanguage } = req.body;

    const summary = await pdfTextToSummary(fileId, selectedLanguage);

    await pool.query(
  `INSERT INTO file_outputs (file_id, user_id, operation_type, language, output_json)
   VALUES ($1, $2, $3, $4, $5)`,
  [fileId, req.user.userId, "summary", selectedLanguage, summary]
);

    res.status(200).json({
      success: true,
      data: summary,
    });

  } catch (error) {

    console.error("Summary Error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

export const pdfToQuizController = async (req, res) => {
  try {

    const { fileId , selectedLanguage} = req.body;

    const quiz = await pdfToQuizService(fileId, selectedLanguage);

    await pool.query(
  `INSERT INTO file_outputs (file_id, user_id, operation_type, language, output_json)
   VALUES ($1, $2, $3, $4, $5)`,
  [fileId, req.user.userId, "quiz", selectedLanguage, quiz]
);

    res.status(200).json({
      success: true,
      quiz,
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};
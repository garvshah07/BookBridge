// import {
//   UploadFile,
//   GetAllUploadFileById,
//   TranslatedTextToPdf,
//   PdfToAudioService,
//   pdfTextToSummary,
//   pdfToQuizService
// } from "../services/uploadfile.service.js";

// export const uploadFileController = async (req, res) => {
//   try {
//     const user = await req.user;
//     const fileData = await UploadFile(req.file, user);

//     return res.status(200).json({
//       success: true,
//       message: "File uploaded successfully",
//       data: fileData,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const getAllUploadFileByIdController = async (req, res) => {
//   try {
//     const user = await req.user;
//     const fileDataById = await GetAllUploadFileById(user);

//     return res.status(200).json({
//       success: true,
//       message: "File uploaded successfully",
//       data: fileDataById,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const translatedFileController = async (req, res) => {
//   try {
//     const { fileId, selectedLanguage } = req.body;

//     const pdfBuffer = await TranslatedTextToPdf(fileId, selectedLanguage);

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": 'attachment; filename="translated.pdf"',
//     });

//     return res.send(pdfBuffer);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };



// export const pdfToAudioController = async (req, res) => {
//   try {
//     const { fileId, selectedLanguage } = req.body;

//     const audioBuffer = await PdfToAudioService(
//       fileId,
//       selectedLanguage
//     );

//     res.set({
//      "Content-Type": "audio/wav",
// "Content-Disposition": 'attachment; filename="document_audio.wav"',
//     });

//     return res.send(audioBuffer);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const pdfTextToSummaryController = async (req, res) => {
//   try {
//     const { fileId, selectedLanguage } = req.body;

//     const pdfBuffer = await pdfTextToSummary(fileId, selectedLanguage);

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": 'attachment; filename="summary.pdf"',
//     });

//     return res.send(pdfBuffer);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };



// export const pdfToQuizController = async (req, res) => {
//   try {
//     const { fileId } = req.body;

//     const quiz = await pdfToQuizService(fileId);

//     return res.status(200).json({
//       success: true,
//       quiz,
//     });

//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };



import {
  UploadFile,
  GetAllUploadFileById,
  TranslatedTextToPdf,
  PdfToAudioService,
  pdfTextToSummary,
  pdfToQuizService,
} from "../services/uploadfile.service.js";

/* ===================== UPLOAD ===================== */

export const uploadFileController = async (req, res) => {
  try {
    const user = await req.user;

    const fileData = await UploadFile(req.file, user);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: fileData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== GET FILES ===================== */

export const getAllUploadFileByIdController = async (req, res) => {
  try {
    const user = await req.user;

    const files = await GetAllUploadFileById(user);

    return res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== TRANSLATE ===================== */

export const translatedFileController = async (req, res) => {
  try {
    const { fileId, selectedLanguage } = req.body;

    const pdfBuffer = await TranslatedTextToPdf(fileId, selectedLanguage);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="translated.pdf"',
    });

    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== AUDIO ===================== */

export const pdfToAudioController = async (req, res) => {
  try {
    const { fileId, selectedLanguage } = req.body;

    const audioBuffer = await PdfToAudioService(fileId, selectedLanguage);

    res.set({
      "Content-Type": "audio/wav",
      "Content-Disposition": 'attachment; filename="document_audio.wav"',
    });

    return res.send(audioBuffer);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== SUMMARY ===================== */

export const pdfTextToSummaryController = async (req, res) => {
  try {
    const { fileId, selectedLanguage } = req.body;

    const pdfBuffer = await pdfTextToSummary(fileId, selectedLanguage);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="summary.pdf"',
    });

    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===================== QUIZ ===================== */

export const pdfToQuizController = async (req, res) => {
  try {
    const { fileId } = req.body;

    const quiz = await pdfToQuizService(fileId);

    return res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
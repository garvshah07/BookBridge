// import pool from "../../src/config/db.js";

/* ===================== UPLOAD File ===================== */

export const UploadFile = async (file) => {
  try {
    if (!file) {
      throw new Error("No file received");
    }

    return {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
    };
  } catch (error) {
    throw new Error("Error uploading file: " + error.message);
  }
};

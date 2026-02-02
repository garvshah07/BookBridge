import pool from "../../src/config/db.js";

/* ===================== UPLOAD File ===================== */

export const UploadFile = async (file, user) => {
  try {
    if (!file) {
      throw new Error("No file received");
    }
    const { userId } = user;
    const { originalname, mimetype, buffer } = file;

    const result = await pool.query(
      `INSERT INTO files (filename, mimetype, data , user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING file_id;`,
      [originalname, mimetype, buffer, userId],
    );

    return result.rows[0];
  } catch (error) {
    throw new Error("Error uploading file: " + error.message);
  }
};

/* ===================== Get UPLOADED File ===================== */

export const GetAllUploadFileById = async (user) => {
  try {
    const { userId } = user;

    const result = await pool.query(
      `SELECT file_id,filename, mimetype, data FROM files WHERE user_id = $1`,
      [userId],
    );

    return result.rows[0];
  } catch (error) {
    throw new Error("Error uploading file: " + error.message);
  }
};

import pool from "../../src/config/db.js";
import { SmartPDFParser } from "pdf-parse-new";
import Groq from "groq-sdk";
import textToStructuredPDF from "../utils/structuredpdf.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ===================== MODEL FALLBACK ORDER ===================== */
const MODELS = [
  "llama-3.1-8b-instant",
  "qwen/qwen3-32b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
];

/* ===================== MODEL FALLBACK ===================== */

async function groqWithFallback(messages) {
  let lastError;

  for (const model of MODELS) {
    try {
      console.log("Trying model:", model);

      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.log(`Model ${model} failed, trying next...`);
      lastError = error;
    }
  }

  throw lastError;
}

/* ===================== TEXT CHUNK HELPER ===================== */
function splitText(text, chunkSize = 4000) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }

  return chunks;
}

/* ===================== UPLOAD FILE ===================== */
export const UploadFile = async (file, user) => {
  try {
    if (!file) throw new Error("No file received");

    const { userId } = user;
    const { originalname, mimetype, buffer } = file;

    const result = await pool.query(
      `INSERT INTO files (filename, mimetype, data, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING file_id;`,
      [originalname, mimetype, buffer, userId],
    );

    return result.rows[0];
  } catch (error) {
    throw new Error("Error uploading file: " + error.message);
  }
};

/* ===================== GET USER FILES ===================== */
export const GetAllUploadFileById = async (user) => {
  try {
    const { userId } = user;

    const result = await pool.query(
      `SELECT file_id, filename, mimetype, created_at
       FROM files
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows;
  } catch (error) {
    throw new Error("Error fetching files: " + error.message);
  }
};

/* ===================== TRANSLATE PDF ===================== */
export const TranslatedTextToPdf = async (id, selectedLanguage) => {
  try {
    const parser = new SmartPDFParser();

    const result = await pool.query(
      `SELECT data FROM files WHERE file_id = $1`,
      [id],
    );

    if (!result.rows.length) {
      throw new Error("File not found");
    }

    const pdfresult = await parser.parse(result.rows[0].data);

    const chunks = splitText(pdfresult.text, 3000);

    let finalText = "";

    for (const chunk of chunks) {
      const translated = await groqWithFallback([
        {
          role: "user",
          content: `
                TASK:
                Translate the content of the PDF into fully Hindi while preserving layout line-by-line as closely as possible.

                INSTRUCTIONS:
                1. Extract and translate text into Hindi.
                2. Preserve original meaning exactly.
                3. Maintain structure, line order, and tables.
                4. Do not merge lines or collapse columns.
                5. Avoid layout misalignment.

                REQUIREMENTS:
                - Language: ${selectedLanguage}
                - Preserve layout structure
                - Maintain translation accuracy
                - Keep IDs, roll numbers, and codes unchanged.

                OUTPUT:
                Return translated text keeping layout readable.


                Text:
                ${chunk}
          `,
        },
      ]);

      finalText += translated + "\n";
    }

    // Convert translated text into structured PDF
    const pdfBuffer = await textToStructuredPDF(finalText, selectedLanguage);

    return pdfBuffer;
  } catch (error) {
    throw new Error("Error translating file: " + error.message);
  }
};

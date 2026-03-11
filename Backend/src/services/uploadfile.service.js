// import pool from "../../src/config/db.js";
// import { SmartPDFParser } from "pdf-parse-new";
// import Groq from "groq-sdk";
// import textToStructuredPDF from "../utils/structuredpdf.js";

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// /* ===================== MODEL FALLBACK ORDER ===================== */
// const MODELS = [
//   "llama-3.1-8b-instant",
//   "qwen/qwen3-32b",
//   "openai/gpt-oss-20b",
//   "llama-3.3-70b-versatile",
// ];

// /* ===================== MODEL FALLBACK ===================== */

// async function groqWithFallback(messages) {
//   let lastError;

//   for (const model of MODELS) {
//     try {
//       console.log("Trying model:", model);

//       const response = await groq.chat.completions.create({
//         model,
//         messages,
//         temperature: 0,
//       });

//       return response.choices[0].message.content;
//     } catch (error) {
//       console.log(`Model ${model} failed, trying next...`);
//       lastError = error;
//     }
//   }

//   throw lastError;
// }

// /* ===================== TEXT CHUNK HELPER ===================== */
// function splitText(text, chunkSize = 4000) {
//   const chunks = [];
//   let start = 0;

//   while (start < text.length) {
//     chunks.push(text.slice(start, start + chunkSize));
//     start += chunkSize;
//   }

//   return chunks;
// }

// /* ===================== UPLOAD FILE ===================== */
// export const UploadFile = async (file, user) => {
//   try {
//     if (!file) throw new Error("No file received");

//     const { userId } = user;
//     const { originalname, mimetype, buffer } = file;

//     const result = await pool.query(
//       `INSERT INTO files (filename, mimetype, data, user_id)
//        VALUES ($1, $2, $3, $4)
//        RETURNING file_id;`,
//       [originalname, mimetype, buffer, userId],
//     );

//     return result.rows[0];
//   } catch (error) {
//     throw new Error("Error uploading file: " + error.message);
//   }
// };

// /* ===================== GET USER FILES ===================== */
// export const GetAllUploadFileById = async (user) => {
//   try {
//     const { userId } = user;

//     const result = await pool.query(
//       `SELECT file_id, filename, mimetype, created_at
//        FROM files
//        WHERE user_id = $1
//        ORDER BY created_at DESC`,
//       [userId],
//     );

//     return result.rows;
//   } catch (error) {
//     throw new Error("Error fetching files: " + error.message);
//   }
// };

// /* ===================== TRANSLATE PDF ===================== */
// export const TranslatedTextToPdf = async (id, selectedLanguage) => {
//   try {
//     const parser = new SmartPDFParser();

//     const result = await pool.query(
//       `SELECT data FROM files WHERE file_id = $1`,
//       [id],
//     );

//     if (!result.rows.length) {
//       throw new Error("File not found");
//     }

//     const pdfresult = await parser.parse(result.rows[0].data);

//     const chunks = splitText(pdfresult.text, 3000);

//     let finalText = "";

//     for (const chunk of chunks) {
//       const translated = await groqWithFallback([
//         {
//           role: "user",
//           content: `
//                 TASK:
//                 Translate the content of the PDF into fully ${selectedLanguage} while preserving layout line-by-line as closely as possible.

//                 INSTRUCTIONS:
//                 1. Extract and translate text into ${selectedLanguage}.
//                 2. Preserve original meaning exactly.
//                 3. Maintain structure, line order, and tables.
//                 4. Do not merge lines or collapse columns.
//                 5. Avoid layout misalignment.

//                 REQUIREMENTS:
//                 - Language: ${selectedLanguage}
//                 - Preserve layout structure
//                 - Maintain translation accuracy
//                 - Keep IDs, roll numbers, and codes unchanged.

//                 OUTPUT:
//                 Return translated text keeping layout readable.


//                 Text:
//                 ${chunk}
//           `,
//         },
//       ]);

//       finalText += translated + "\n";
//     }

//     // Convert translated text into structured PDF
//     const pdfBuffer = await textToStructuredPDF(finalText, selectedLanguage);

//     return pdfBuffer;
//   } catch (error) {
//     throw new Error("Error translating file: " + error.message);
//   }
// };

// /* ===================== TEXT TO SPEECH ===================== */
// async function textToSpeechGroq(text) {
//   const response = await groq.audio.speech.create({
//     model: "canopylabs/orpheus-v1-english",
//     voice: "diana",
//     input: text.slice(0, 4000), // safety limit
//       response_format: "wav",
//   });

//   const audioArrayBuffer = await response.arrayBuffer();
//   return Buffer.from(audioArrayBuffer);
// }

// /* ===================== PDF TO AUDIO ===================== */
// export const PdfToAudioService = async (file_id, language) => {
//   try {
//     const parser = new SmartPDFParser();

//     const result = await pool.query(
//       `SELECT data FROM files WHERE file_id = $1`,
//       [file_id]
//     );

//     if (!result.rows.length) {
//       throw new Error("File not found");
//     }

//     const pdfresult = await parser.parse(result.rows[0].data);

//     const translatedText = await groqWithFallback([
//       {
//         role: "user",
//         content: `Translate the following text into ${language}:\n\n${pdfresult.text}`,
//       },
//     ]);

//     const audioBuffer = await textToSpeechGroq(translatedText);

//     return audioBuffer;

//   } catch (error) {
//     throw new Error("Audio generation failed: " + error.message);
//   }
// };


// /* ===================== PDF TO SUMMRISE TEXT ===================== */


// export const pdfTextToSummary = async (id, selectedLanguage) => {
//   try {
//     const parser = new SmartPDFParser();

//     const result = await pool.query(
//       `SELECT data FROM files WHERE file_id = $1`,
//       [id],
//     );

//     if (!result.rows.length) {
//       throw new Error("File not found");
//     }

//     const pdfresult = await parser.parse(result.rows[0].data);

//     const chunks = splitText(pdfresult.text, 3000);

//     let finalText = "";

//     for (const chunk of chunks) {
//       const summarized = await groqWithFallback([
//     {
//       role: "user",
//       content: `
//                 ROLE:
//                 You are an expert document analyst.

//                 TASK:
//                 Analyze the provided PDF text and produce a high-quality structured summary.

//                 OBJECTIVE:
//                 Extract the most important information while keeping the meaning accurate and clear.

//                 INSTRUCTIONS:
//                 1. Carefully read the text.
//                 2. Identify the main topic and purpose.
//                 3. Extract key concepts, arguments, and important facts.
//                 4. Remove repetition, filler sentences, and minor details.
//                 5. Keep technical terms, numbers, names, IDs, and references unchanged.
//                 6. Do NOT invent information that is not present in the text.

//                 SUMMARY REQUIREMENTS:
//                 - The summary must be significantly shorter than the original.
//                 - Use clear and simple language.
//                 - Preserve the logical flow of ideas.
//                 - Focus only on important information.

//                 OUTPUT FORMAT:

//                 Main Topic:
//                 Briefly describe what this section is about.

//                 Key Points:
//                 - Important idea 1
//                 - Important idea 2
//                 - Important idea 3

//                 Important Facts / Details:
//                 - definitions
//                 - numbers
//                 - concepts
//                 - examples (if important)

//                 Short Summary:
//                 2–4 sentence concise summary of the section.

//                 TEXT:
//                 ${chunk}
//                 `,
//                     },
//   ]);

//   finalText += summarized + "\n";
// }
//     // Convert translated text into structured PDF
//     const pdfBuffer = await textToStructuredPDF(finalText, selectedLanguage);

//     return pdfBuffer;
//   } catch (error) {
//     throw new Error("Error translating file: " + error.message);
//   }
// };


// /* ===================== PDF TO QUIZ ===================== */

// export const pdfToQuizService = async (id) => {
//   try {
//     const parser = new SmartPDFParser();

//     const result = await pool.query(
//       `SELECT data FROM files WHERE file_id = $1`,
//       [id]
//     );

//     if (!result.rows.length) {
//       throw new Error("File not found");
//     }

//     const pdfresult = await parser.parse(result.rows[0].data);

//     const chunks = splitText(pdfresult.text, 3000);

//     let combinedText = "";

//     for (const chunk of chunks) {
//       combinedText += chunk + "\n";
//     }

//     const quiz = await groqWithFallback([
//       {
//         role: "user",
//         content: `
// ROLE:
// You are an expert teacher.

// TASK:
// Generate a quiz based on the provided document.

// INSTRUCTIONS:
// 1. Read the document content carefully.
// 2. Create exactly 10 questions.
// 3. Questions must test understanding of key concepts.
// 4. Avoid duplicate or trivial questions.
// 5. Questions must come only from the document.

// QUIZ FORMAT:

// Return ONLY valid JSON.

// {
//   "quiz":[
//     {
//       "question": "Question text",
//       "options": [
//         "Option A",
//         "Option B",
//         "Option C",
//         "Option D"
//       ],
//       "answer": "Correct option text"
//     }
//   ]
// }

// DOCUMENT:
// ${combinedText}
//         `,
//       },
//     ]);

//     return JSON.parse(quiz);

//   } catch (error) {
//     throw new Error("Error generating quiz: " + error.message);
//   }
// };



import pool from "../../src/config/db.js";
import { SmartPDFParser } from "pdf-parse-new";
import Groq from "groq-sdk";
import textToStructuredPDF from "../utils/structuredpdf.js";
import Tesseract from "tesseract.js";

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
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0,
      });

      return response.choices[0].message.content;
    } catch (error) {
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

/* ===================== IMAGE OCR ===================== */

async function extractTextFromImage(buffer) {
  const { data } = await Tesseract.recognize(buffer, "eng");
  return data.text;
}

/* ===================== UNIVERSAL TEXT EXTRACTION ===================== */

async function extractTextFromFile(buffer, mimetype, filename = "") {
  const type = mimetype?.toLowerCase();

  /* ---------- PDF ---------- */

  if (
    type === "application/pdf" ||
    filename.toLowerCase().endsWith(".pdf")
  ) {
    const parser = new SmartPDFParser();
    const pdfresult = await parser.parse(buffer);
    return pdfresult.text;
  }

  /* ---------- IMAGE ---------- */

  if (
    type?.startsWith("image/") ||
    filename.match(/\.(jpg|jpeg|png|webp)$/i)
  ) {
    return await extractTextFromImage(buffer);
  }

  /* ---------- FALLBACK FOR OCTET STREAM ---------- */

  if (type === "application/octet-stream") {
    try {
      const parser = new SmartPDFParser();
      const pdfresult = await parser.parse(buffer);
      return pdfresult.text;
    } catch {
      return await extractTextFromImage(buffer);
    }
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

/* ===================== UPLOAD FILE ===================== */

export const UploadFile = async (file, user) => {
  try {
    if (!file) throw new Error("No file received");

    const { userId } = user;
    const { originalname, mimetype, buffer } = file;

    const result = await pool.query(
      `INSERT INTO files (filename, mimetype, data, user_id)
       VALUES ($1,$2,$3,$4)
       RETURNING file_id`,
      [originalname, mimetype, buffer, userId]
    );

    return result.rows[0];
  } catch (error) {
    throw new Error("Error uploading file: " + error.message);
  }
};

/* ===================== GET USER FILES ===================== */

export const GetAllUploadFileById = async (user) => {
  try {
    const result = await pool.query(
      `SELECT file_id, filename, mimetype, created_at
       FROM files
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.userId]
    );

    return result.rows;
  } catch (error) {
    throw new Error("Error fetching files: " + error.message);
  }
};

/* ===================== TRANSLATE ===================== */

export const TranslatedTextToPdf = async (id, selectedLanguage) => {
  try {
    const result = await pool.query(
      `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
      [id]
    );

    if (!result.rows.length) throw new Error("File not found");

    const { data, mimetype, filename } = result.rows[0];

    const extractedText = await extractTextFromFile(data, mimetype, filename);

    const chunks = splitText(extractedText, 3000);

    let finalText = "";

    for (const chunk of chunks) {
      const translated = await groqWithFallback([
        {
          role: "user",
          content: `Translate the following text into ${selectedLanguage}:\n\n${chunk}`,
        },
      ]);

      finalText += translated + "\n";
    }

    const pdfBuffer = await textToStructuredPDF(finalText, selectedLanguage);

    return pdfBuffer;
  } catch (error) {
    throw new Error("Error translating file: " + error.message);
  }
};

/* ===================== TEXT TO SPEECH ===================== */

async function textToSpeechGroq(text) {
  const response = await groq.audio.speech.create({
    model: "canopylabs/orpheus-v1-english",
    voice: "diana",
    input: text.slice(0, 4000),
    response_format: "wav",
  });

  const audioArrayBuffer = await response.arrayBuffer();
  return Buffer.from(audioArrayBuffer);
}

/* ===================== AUDIO ===================== */

export const PdfToAudioService = async (file_id, language) => {
  try {
    const result = await pool.query(
      `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
      [file_id]
    );

    if (!result.rows.length) throw new Error("File not found");

    const { data, mimetype, filename } = result.rows[0];

    const extractedText = await extractTextFromFile(data, mimetype, filename);

    const translatedText = await groqWithFallback([
      {
        role: "user",
        content: `Translate the following text into ${language}:\n\n${extractedText}`,
      },
    ]);

    const audioBuffer = await textToSpeechGroq(translatedText);

    return audioBuffer;
  } catch (error) {
    throw new Error("Audio generation failed: " + error.message);
  }
};

/* ===================== SUMMARY ===================== */

export const pdfTextToSummary = async (id, selectedLanguage) => {
  try {
    const result = await pool.query(
      `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
      [id]
    );

    if (!result.rows.length) throw new Error("File not found");

    const { data, mimetype, filename } = result.rows[0];

    const extractedText = await extractTextFromFile(data, mimetype, filename);

    const chunks = splitText(extractedText, 3000);

    let finalText = "";

    for (const chunk of chunks) {
      const summarized = await groqWithFallback([
        {
          role: "user",
          content: `Summarize the following text clearly:\n\n${chunk}`,
        },
      ]);

      finalText += summarized + "\n";
    }

    const pdfBuffer = await textToStructuredPDF(finalText, selectedLanguage);

    return pdfBuffer;
  } catch (error) {
    throw new Error("Error summarizing file: " + error.message);
  }
};

/* ===================== QUIZ ===================== */

export const pdfToQuizService = async (id) => {
  try {
    const result = await pool.query(
      `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
      [id]
    );

    if (!result.rows.length) throw new Error("File not found");

    const { data, mimetype, filename } = result.rows[0];

    const extractedText = await extractTextFromFile(data, mimetype, filename);

    const quiz = await groqWithFallback([
      {
        role: "user",
        content: `
Create 10 multiple choice quiz questions from the following document.

Return JSON only.

{
 "quiz":[
  {
   "question":"...",
   "options":["A","B","C","D"],
   "answer":"..."
  }
 ]
}

Document:
${extractedText}
`,
      },
    ]);

    return JSON.parse(quiz);
  } catch (error) {
    throw new Error("Error generating quiz: " + error.message);
  }
};
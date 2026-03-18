// import pool from "../../src/config/db.js";
// import { SmartPDFParser } from "pdf-parse-new";
// import Groq from "groq-sdk";
// import textToStructuredPDF from "../utils/structuredpdf.js";
// import { recognize } from "node-tesseract-ocr"

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

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ===================== MODEL FALLBACK ===================== */

const MODELS = [
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
  "openai/gpt-oss-20b"
];

async function groqWithFallback(messages) {
  let lastError;

  for (const model of MODELS) {
    try {
      const res = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0
      });

      return res.choices[0].message.content;

    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

/* ===================== TEXT CHUNK ===================== */

function splitText(text, size = 2000) {

  const chunks = [];

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }

  return chunks;
}

/* ===================== IMAGE → TEXT (VISION MODEL) ===================== */
async function extractTextFromImage(buffer, mimetype = "image/png") {

  const base64 = buffer.toString("base64");

  const res = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all readable text from this image. Return only the text."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimetype};base64,${base64}`
            }
          }
        ]
      }
    ]
  });

  return res.choices[0].message.content;
}

/* ===================== UNIVERSAL TEXT EXTRACTION ===================== */

async function getTextFromFile(buffer, mimetype, filename="") {

  const type = mimetype?.toLowerCase();

  /* ---------- PDF ---------- */

  if (type === "application/pdf" || filename.endsWith(".pdf")) {

    const parser = new SmartPDFParser();
    const pdf = await parser.parse(buffer);

    return pdf.text;
  }

  /* ---------- IMAGE ---------- */

  if (
    type?.startsWith("image/") ||
    filename.match(/\.(jpg|jpeg|png|webp)$/i)
  ) {

    return await extractTextFromImage(buffer , mimetype);
  }

  /* ---------- FALLBACK ---------- */

  try {

    const parser = new SmartPDFParser();
    const pdf = await parser.parse(buffer);

    return pdf.text;

  } catch {

    return await extractTextFromImage(buffer , mimetype);

  }
}

/* ===================== LLM PROCESSOR ===================== */

async function processWithLLM(text, prompt) {

  const chunks = splitText(text);

  let output = "";

  for (const chunk of chunks) {

    const res = await groqWithFallback([
      {
        role: "user",
        content: prompt.replace("{{TEXT}}", chunk)
      }
    ]);

    output += res + "\n";
  }

  return output;
}

/* ===================== UPLOAD FILE ===================== */

export const UploadFile = async (file, user) => {

  if (!file) throw new Error("No file received");

  const { userId } = user;
  const { originalname, mimetype, buffer } = file;

  const result = await pool.query(
    `INSERT INTO files (filename,mimetype,data,user_id)
     VALUES ($1,$2,$3,$4)
     RETURNING file_id`,
    [originalname, mimetype, buffer, userId]
  );

  return result.rows[0];
};

/* ===================== GET USER FILES ===================== */

export const GetAllUploadFileById = async (user) => {

  const result = await pool.query(
    `SELECT file_id,filename,mimetype,created_at
     FROM files
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [user.userId]
  );

  return result.rows;
};

/* ===================== TRANSLATE ===================== */

export const TranslatedTextToPdf = async (id, language) => {

  const result = await pool.query(
    `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
    [id]
  );

  if (!result.rows.length) throw new Error("File not found");

  const { data, mimetype, filename } = result.rows[0];

  const text = await getTextFromFile(data, mimetype, filename);

  const translated = await processWithLLM(
    text,
    `Translate the following text into ${language}:

{{TEXT}}`
  );

  return await textToStructuredPDF(translated, language);
};

/* ===================== TEXT TO SPEECH ===================== */

async function textToSpeechGroq(text) {

  const res = await groq.audio.speech.create({
    model: "canopylabs/orpheus-v1-english",
    voice: "diana",
    input: text.slice(0,2500),
    response_format: "wav"
  });

  const buf = await res.arrayBuffer();

  return Buffer.from(buf);
}

/* ===================== AUDIO ===================== */

export const PdfToAudioService = async (fileId, language) => {

  const result = await pool.query(
    `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
    [fileId]
  );

  if (!result.rows.length) throw new Error("File not found");

  const { data, mimetype, filename } = result.rows[0];

  const text = await getTextFromFile(data, mimetype, filename);

  const translated = await processWithLLM(
    text,
    `Translate the following text into ${language}:

{{TEXT}}`
  );

  return await textToSpeechGroq(translated);
};

/* ===================== SUMMARY ===================== */

// export const pdfTextToSummary = async (id, language) => {

//   const result = await pool.query(
//     `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
//     [id]
//   );

//   if (!result.rows.length) throw new Error("File not found");

//   const { data, mimetype, filename } = result.rows[0];

//   const text = await getTextFromFile(data, mimetype, filename);

//   const summary = await processWithLLM(
//     text,
//     `Summarize the following text:

// {{TEXT}}`
//   );

//   return await textToStructuredPDF(summary, language);
// };


// export const pdfTextToSummary = async (id, language) => {

//   const result = await pool.query(
//     `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
//     [id]
//   );

//   if (!result.rows.length) throw new Error("File not found");

//   const { data, mimetype, filename } = result.rows[0];

//   const text = await getTextFromFile(data, mimetype, filename);

//   // 🔥 Detect content type
//   const isShortText = text.length < 800;

//   // 🔥 Reading time
//   const words = text.split(/\s+/).length;
//   const estimatedTime = Math.max(1, Math.ceil(words / 200)) + " min";

//   // 🔥 Dynamic instruction
//   const modeInstruction = isShortText
//     ? "This is SHORT content. Do NOT create many chapters. Group into 1–3 meaningful sections."
//     : "This is LONG content. Split into 3–6 meaningful chapters based on topics.";

//   // 🔥 LLM CALL
//   const rawResponse = await groqWithFallback([
//     {
//       role: "user",
//       content: `
// You are an expert document analyzer.

// ${modeInstruction}

// Return ONLY valid JSON. No markdown.

// FORMAT:
// {
//   "title": "Document Title",
//   "totalChapters": number,
//   "totalTime": "${estimatedTime}",
//   "chapters": [
//     {
//       "title": "Section title",
//       "time": "reading time",
//       "content": "clear explanation"
//     }
//   ]
// }

// RULES:
// - Do NOT hallucinate
// - Use meaningful titles (no "Introduction")
// - Keep content concise
// - Do NOT return extra text

// TEXT:
// ${text.slice(0, 15000)}
// `
//     }
//   ]);

//   // 🔥 CLEAN RESPONSE
//   const cleaned = rawResponse
//     .replace(/```json/g, "")
//     .replace(/```/g, "")
//     .trim();

//   // 🔥 EXTRACT JSON
//   const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

//   if (!jsonMatch) {
//     throw new Error("Invalid JSON response from AI");
//   }

//   let parsed = JSON.parse(jsonMatch[0]);

//   // 🔥 SAFETY FIXES
//   if (!parsed.totalTime) {
//     parsed.totalTime = estimatedTime;
//   }

//   if (!parsed.totalChapters && parsed.chapters) {
//     parsed.totalChapters = parsed.chapters.length;
//   }

//   return parsed;
// };

export const pdfTextToSummary = async (id, language) => {

  const result = await pool.query(
    `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
    [id]
  );

  if (!result.rows.length) throw new Error("File not found");

  const { data, mimetype, filename } = result.rows[0];

  const text = await getTextFromFile(data, mimetype, filename);

  // 🔥 Detect content type
  const isShortText = text.length < 800;

  // 🔥 Reading time
  const words = text.split(/\s+/).length;
  const estimatedTime = Math.max(1, Math.ceil(words / 200)) + " min";

  // 🔥 Dynamic instruction
  const modeInstruction = isShortText
    ? "This is SHORT content. Group into 1–3 meaningful sections."
    : "This is LONG content. Split into 3–6 meaningful chapters based on topics.";

  // 🔥 Language instruction (STRONG CONTROL)
  const languageInstruction = `
IMPORTANT:
- Generate the entire response strictly in ${language}
- Do NOT mix languages
- Translate headings and content into ${language}
- Keep technical terms, names, IDs unchanged if needed
- If output is not fully in ${language}, regenerate internally
`;

  // 🔥 LLM CALL
  const rawResponse = await groqWithFallback([
    {
      role: "user",
      content: `
You are an expert document analyzer.

${languageInstruction}

${modeInstruction}

Return ONLY valid JSON. No markdown.

FORMAT:
{
  "title": "Document Title",
  "totalChapters": number,
  "totalTime": "${estimatedTime}",
  "chapters": [
    {
      "title": "Section title",
      "time": "reading time",
      "content": "clear explanation"
    }
  ]
}

RULES:
- Output language MUST be ${language}
- Do NOT hallucinate
- Use meaningful titles (no "Introduction")
- Keep content concise
- Keep JSON strictly valid
- Do NOT return extra text outside JSON

TEXT:
${text.slice(0, 15000)}
`
    }
  ]);

  // 🔥 CLEAN RESPONSE
  const cleaned = rawResponse
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  // 🔥 EXTRACT JSON SAFELY
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid JSON response from AI");
  }

  let parsed;

  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("JSON Parse Error:", cleaned);
    throw new Error("AI returned invalid JSON");
  }

  // 🔥 SAFETY FIXES
  if (!parsed.totalTime) {
    parsed.totalTime = estimatedTime;
  }

  if (!parsed.totalChapters && parsed.chapters) {
    parsed.totalChapters = parsed.chapters.length;
  }

  // 🔥 FINAL FALLBACK STRUCTURE
  if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
    parsed.chapters = [
      {
        title: "Summary",
        time: estimatedTime,
        content: text.slice(0, 500)
      }
    ];
    parsed.totalChapters = 1;
  }

  return parsed;
};


/* ===================== QUIZ ===================== */

// export const pdfToQuizService = async (id) => {

//   const result = await pool.query(
//     `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
//     [id]
//   );

//   if (!result.rows.length) throw new Error("File not found");

//   const { data, mimetype, filename } = result.rows[0];

//   const text = await getTextFromFile(data, mimetype, filename);

//   const res = await groqWithFallback([
//     {
//       role: "user",
//       content: `
// Create 10 MCQ questions from the following text.

// Return ONLY JSON.

// {
//  "quiz":[
//   {
//    "question":"...",
//    "options":["A","B","C","D"],
//    "answer":"..."
//   }
//  ]
// }

// TEXT:
// ${text}
// `
//     }
//   ]);

//   const json = res.match(/\{[\s\S]*\}/);

//   return JSON.parse(json[0]);
// };


export const pdfToQuizService = async (id, language) => {
  console.log(language)

  const result = await pool.query(
    `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
    [id]
  );

  if (!result.rows.length) throw new Error("File not found");

  const { data, mimetype, filename } = result.rows[0];

  const text = await getTextFromFile(data, mimetype, filename);

  const limitedText = text.slice(0, 12000);

  let processedText = limitedText;

  // 🔥 STEP 1: TRANSLATE ONLY IF NEEDED
  if (language !== "English") {

    console.log("Translating to:", language);

    processedText = await processWithLLM(
      limitedText,
      `
Translate the following text into ${language}.

RULES:
- Keep meaning accurate
- Do NOT add explanation
- Return ONLY translated text

TEXT:
{{TEXT}}
`
    );
  }

  // 🔥 STEP 2: GENERATE QUIZ FROM FINAL TEXT
  const rawResponse = await groqWithFallback([
    {
      role: "user",
      content: `
You are an expert teacher.

Generate exactly 10 MCQ questions from the given text.

FORMAT (STRICT JSON ONLY):
{
  "quiz":[
    {
      "question":"...",
      "options":["...","...","...","..."],
      "answer":"A"
    }
  ]
}

RULES:
- Questions must be in ${language}
- Options must be in ${language}
- Answer must be A/B/C/D only
- No explanation
- No markdown
- No extra text
- JSON must be valid

TEXT:
${processedText}
`
    }
  ]);

  // 🔥 CLEAN RESPONSE
  const cleaned = rawResponse
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid JSON response from AI");
  }

  let parsed;

  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Quiz JSON Parse Error:", cleaned);
    throw new Error("AI returned invalid JSON");
  }

  // 🔥 SAFETY FIX
  if (!parsed.quiz || !Array.isArray(parsed.quiz)) {
    throw new Error("Invalid quiz structure");
  }

  // 🔥 NORMALIZE ANSWERS
  parsed.quiz = parsed.quiz.map(q => ({
    ...q,
    answer: (q.answer || "A").toString().trim().toUpperCase().charAt(0)
  }));

  return parsed;
};
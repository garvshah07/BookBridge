import pool from "../../src/config/db.js";
import { SmartPDFParser } from "pdf-parse-new";
import Groq from "groq-sdk";
import textToStructuredPDF from "../utils/structuredpdf.js";
import axios from "axios";


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const TTS_URL = "https://bookbridge-nlkz.onrender.com/tts";



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

// async function textToSpeechGroq(text) {

//   const res = await groq.audio.speech.create({
//     model: "canopylabs/orpheus-v1-english",
//     voice: "diana",
//     input: text.slice(0,2500),
//     response_format: "wav"
//   });

//   const buf = await res.arrayBuffer();

//   return Buffer.from(buf);
// }


async function textToSpeechRender(text, language) {
  try {
    const safeText = text.slice(0, 500); // keep for now

    const res = await axios.post(
      TTS_URL,
      {
        text: safeText,
        language: language // ✅ FIXED
      },
      {
        responseType: "arraybuffer",
        timeout: 60000
      }
    );

    return Buffer.from(res.data);

  } catch (error) {
    console.error("❌ TTS ERROR:", error.message);
    throw new Error("TTS failed");
  }
}


export const PdfToAudioService = async (fileId, language) => {

  // ✅ CACHE
  const existing = await pool.query(
    `SELECT output_data FROM file_outputs
     WHERE file_id=$1 AND operation_type='audio' AND language=$2`,
    [fileId, language]
  );

  if (existing.rows.length) {
    return existing.rows[0].output_data;
  }

  // 📄 GET FILE
  const result = await pool.query(
    `SELECT data,mimetype,filename FROM files WHERE file_id=$1`,
    [fileId]
  );

  if (!result.rows.length) throw new Error("File not found");

  const { data, mimetype, filename } = result.rows[0];

  const text = await getTextFromFile(data, mimetype, filename);

  // 🔥 STRICT TRANSLATION
  let translated = await processWithLLM(
    text,
    `
You are a strict translation engine.

TASK:
Translate the text into ${language}.

RULES:
- Return ONLY translated text
- NO explanation
- NO headings
- Keep structure same

TEXT:
{{TEXT}}
`
  );

  // 🔥 GUJARATI FIX
  let ttsLanguage = language;

  if (language === "Gujarati") {
    translated = await processWithLLM(
      translated,
      `
Convert this Gujarati text into Hindi phonetic pronunciation.

RULES:
- Use Hindi script
- Natural pronunciation
- NO extra text

TEXT:
{{TEXT}}
`
    );

    ttsLanguage = "Hindi";
  }

  // 🔊 GENERATE AUDIO
  const audioBuffer = await textToSpeechRender(translated, ttsLanguage);

  return audioBuffer;
};


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

export const pdfToQuizService = async (id, language) => {
 
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





export const deleteFileById = async (file_id) => {

const result = await pool.query(
    `DELETE FROM table_name WHERE file_id=$1`,
    [file_id]
  );


  if (!result.rows.length) throw new Error("File not found to delete");


   return { message: "File deleted successfully" };

}
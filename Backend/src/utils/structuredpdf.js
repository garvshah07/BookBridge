import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_PATH = path.resolve(__dirname, "../fonts/hindi.ttf");
const GUJARATI_FONT = path.resolve(__dirname, "../fonts/gujarati.ttf");
const ENGLISH_FONT = path.resolve(__dirname, "../fonts/english.ttf");

/* ===================== PDF RECONSTRUCTION ===================== */

const textToStructuredPDF = (text, language) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    const stream = new PassThrough();
    const buffers = [];

    stream.on("data", buffers.push.bind(buffers));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
    stream.on("error", reject);

    doc.pipe(stream);

    const fontPath =
      language === "Gujarati"
        ? GUJARATI_FONT
        : language === "Hindi"
          ? FONT_PATH
          : ENGLISH_FONT;

    doc.font(fontPath);

    const lines = text.split("\n");

    lines.forEach((line) => {
      if (!line.trim()) {
        doc.moveDown();
      } else if (line.length < 60) {
        // treat short lines as headings
        doc.fontSize(14).text(line, { align: "left" });
        doc.moveDown(0.5);
      } else {
        doc.fontSize(11).text(line, {
          align: "left",
          lineGap: 2,
        });
      }
    });

    doc.end();
  });
};

export default textToStructuredPDF;

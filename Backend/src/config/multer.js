import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(), // ✅ buffer enabled
  limits: {
    fileSize: 7 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "application/octet-stream",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and JPG files are allowed"), false);
    }
  },
});

export default upload;

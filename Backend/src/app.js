import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import uploadFileRouter from "./routes/uploadfile.routes.js";
import { authenticate } from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:5173",
  "https://book-bridge-sage.vercel.app",
  "https://bridgebook-kappa.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Hello, Express.js Server!");
});

app.use("/api/users", userRouter);

app.use("/api/file", authenticate, uploadFileRouter);

export default app;

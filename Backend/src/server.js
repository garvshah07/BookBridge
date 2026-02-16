import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js";

dotenv.config({ path: "../.env" });

const PORT = process.env.PORT_NUMBER || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

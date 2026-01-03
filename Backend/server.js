import dotenv from "dotenv";
import { connectDb } from "./src/config/db.js";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT_NUMBER || 5000;

await connectDb();

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});

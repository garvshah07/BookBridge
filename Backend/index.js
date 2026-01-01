import express from "express";
import dotenv from "dotenv";


dotenv.config();

const app = express();

app.get("/",  (req, res) => {
  res.send("Hello, Express.js Server!");
});

app.listen(process.env.PORT_NUMBER, () => {
  console.log(`Server running at ${process.env.PORT_NUMBER}`);
});

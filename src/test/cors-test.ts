import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.get("/test", (_req, res) => {
  res.json({
    success: true,
    message: "CORS is working",
  });
});

app.listen(5002, () => {
  console.log("CORS middleware loaded successfully");
});
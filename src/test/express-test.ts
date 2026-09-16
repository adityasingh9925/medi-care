import express from "express";

const app = express();

app.get("/test", (_req, res) => {
  res.json({
    success: true,
    message: "Express is working",
  });
});

app.listen(5001, () => {
  console.log("Express is working on port 5001");
});
import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get("/", (_req, res) => {
  res.send("Auralis Backend 🚀");
});

app.listen(port, () => {
  console.log(`Auralis backend lancé sur http://localhost:${port}`);
});
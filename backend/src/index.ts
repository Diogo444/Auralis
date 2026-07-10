import "dotenv/config";
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { analysisRouter } from "./routes/analysis.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "64kb" }));

app.get("/", (_req, res) => {
  res.send("Auralis Backend");
});

app.use("/api/analysis", analysisRouter);

app.use(errorHandler);

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Auralis backend lance sur http://localhost:${env.port}`);
});

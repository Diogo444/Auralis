import type { Request, Response } from "express";
import { enqueueAnalysis } from "../services/analysis-queue.service.js";
import { analyzeFrameWithGemini } from "../services/gemini.service.js";
import { AnalysisFrameRequestSchema } from "../schemas/analysis.schema.js";
import { HttpError } from "../middleware/error-handler.js";

export async function analyzeFrameController(req: Request, res: Response) {
  const parsed = AnalysisFrameRequestSchema.parse(req.body);

  if (!req.file) {
    throw new HttpError(400, "Image manquante");
  }

  const result = await enqueueAnalysis(() =>
    analyzeFrameWithGemini({
      mission: parsed.mission,
      imageBuffer: req.file!.buffer,
      mimeType: req.file!.mimetype,
    }),
  );

  return res.json(result);
}

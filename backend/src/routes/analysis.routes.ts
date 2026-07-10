import { Router, type Router as ExpressRouter } from "express";
import { analyzeFrameController } from "../controllers/analysis.controller.js";
import { uploadAnalysisFrame } from "../middleware/request-limits.js";

export const analysisRouter: ExpressRouter = Router();

analysisRouter.post(
  "/frame",
  uploadAnalysisFrame.single("image"),
  analyzeFrameController,
);

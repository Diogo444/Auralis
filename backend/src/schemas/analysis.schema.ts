import { z } from "zod";
import { env } from "../config/env.js";

export const AnalysisFrameRequestSchema = z.object({
  mission: z.string().trim().min(1).max(env.maxMissionChars),
});

export const AnalysisResultSchema = z.object({
  matched: z.boolean(),
  confidence: z.number().min(0).max(1),
  message: z.string().trim().min(1),
  reason: z.string().trim().min(1),
});

export const AcceptedImageMimeTypes = ["image/jpeg", "image/webp"] as const;

export function isAcceptedImageMimeType(
  mimeType: string,
): mimeType is (typeof AcceptedImageMimeTypes)[number] {
  return AcceptedImageMimeTypes.includes(
    mimeType as (typeof AcceptedImageMimeTypes)[number],
  );
}

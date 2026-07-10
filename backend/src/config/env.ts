import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY est manquant"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash-lite"),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  ANALYSIS_CONCURRENCY: z.coerce.number().int().positive().default(5),
  ANALYSIS_QUEUE_LIMIT: z.coerce.number().int().positive().default(10),
  ANALYSIS_MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(1_000_000),
  ANALYSIS_MAX_MISSION_CHARS: z.coerce.number().int().positive().default(500),
  GEMINI_LOG_PATH: z.string().optional(),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  port: parsed.PORT,
  geminiApiKey: parsed.GEMINI_API_KEY,
  geminiModel: parsed.GEMINI_MODEL,
  geminiTimeoutMs: parsed.GEMINI_TIMEOUT_MS,
  analysisConcurrency: parsed.ANALYSIS_CONCURRENCY,
  analysisQueueLimit: parsed.ANALYSIS_QUEUE_LIMIT,
  maxImageBytes: parsed.ANALYSIS_MAX_IMAGE_BYTES,
  maxMissionChars: parsed.ANALYSIS_MAX_MISSION_CHARS,
  geminiLogPath: parsed.GEMINI_LOG_PATH,
};

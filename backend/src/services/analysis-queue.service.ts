import pLimit from "p-limit";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/error-handler.js";

const geminiLimit = pLimit(env.analysisConcurrency);

export async function enqueueAnalysis<T>(task: () => Promise<T>): Promise<T> {
  const queuedWork = geminiLimit.activeCount + geminiLimit.pendingCount;

  if (queuedWork >= env.analysisQueueLimit) {
    throw new HttpError(429, "Trop d'analyses en attente");
  }

  return geminiLimit(task);
}

import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../config/env.js";
import { AnalysisResultSchema } from "../schemas/analysis.schema.js";
import type { AnalysisResult, AnalyzeFrameInput } from "../types/analysis.js";

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    matched: { type: Type.BOOLEAN },
    confidence: { type: Type.NUMBER },
    message: { type: Type.STRING },
    reason: { type: Type.STRING },
  },
  required: ["matched", "confidence", "message", "reason"],
};

function buildPrompt(mission: string) {
  return `
Tu es Auralis, un assistant visuel pour personne déficiente visuelle.

Mission utilisateur :
"${mission}"

Analyse l'image actuelle et réponds uniquement avec le JSON demandé.

Règles :
- matched vaut true uniquement si la mission est clairement validée.
- confidence est entre 0 et 1.
- message doit être court, oral et naturel.
- Ne donne pas d'ordre dangereux.
- Si tu n'es pas sûr, matched doit être false.
`;
}

export async function analyzeFrameWithGemini({
  mission,
  imageBuffer,
  mimeType,
}: AnalyzeFrameInput): Promise<AnalysisResult> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    env.geminiTimeoutMs,
  );

  try {
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBuffer.toString("base64"),
          },
        },
        {
          text: buildPrompt(mission),
        },
      ],
      config: {
        abortSignal: timeoutController.signal,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    });

    const text = response.text ?? "";
    const json = JSON.parse(text);
    return AnalysisResultSchema.parse(json);
  } finally {
    clearTimeout(timeoutId);
  }
}

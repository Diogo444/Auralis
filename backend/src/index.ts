import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const port = Number(process.env.PORT ?? 3000);

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY est manquant dans le fichier .env");
}

const ai = new GoogleGenAI({
  apiKey,
});

const AnalyzeFrameSchema = z.object({
  mission: z.string().min(1),
  imageBase64: z.string().min(1),
  mimeType: z.string().default("image/jpeg"),
});

app.get("/", (_req, res) => {
  res.send("Auralis Backend 🚀");
});

app.post("/analyze-frame", async (req, res) => {
  try {
    const parsed = AnalyzeFrameSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Requête invalide",
        details: parsed.error.issues,
      });
    }

    const { mission, imageBase64, mimeType } = parsed.data;

    const prompt = `
Tu es Auralis, un assistant visuel pour personne déficiente visuelle.

Mission utilisateur :
"${mission}"

Analyse l'image actuelle et réponds uniquement en JSON valide.

Format obligatoire :
{
  "matched": boolean,
  "confidence": number,
  "message": string,
  "reason": string
}

Règles :
- matched vaut true uniquement si la mission est clairement validée.
- confidence est entre 0 et 1.
- message doit être court, oral et naturel.
- Ne donne pas d'ordre dangereux.
- Si tu n'es pas sûr, matched doit être false.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        {
          text: prompt,
        },
      ],
    });

    const text = response.text ?? "";

    return res.json({
      raw: text,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur pendant l'analyse de l'image",
    });
  }
});

app.listen(port, () => {
  console.log(`Auralis backend lancé sur http://localhost:${port}`);
});
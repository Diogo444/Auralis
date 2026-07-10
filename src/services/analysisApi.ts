import type { AnalysisResult } from "@/types/analysis";

type AnalyzeFramePayload = {
  mission: string;
  image: Blob;
  signal?: AbortSignal;
};

const analysisEndpoint =
  import.meta.env.VITE_ANALYSIS_ENDPOINT ?? "/api/analysis/frame";

export async function analyzeFrame({
  mission,
  image,
  signal,
}: AnalyzeFramePayload): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("mission", mission);
  formData.append("image", image, "frame.jpg");

  const response = await fetch(analysisEndpoint, {
    method: "POST",
    body: formData,
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : `Serveur injoignable (status ${response.status})`;
    throw new Error(message);
  }

  return data as AnalysisResult;
}

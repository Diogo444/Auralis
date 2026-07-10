import { ref, type Ref } from "vue";
import { analyzeFrame } from "@/services/analysisApi";
import type { AnalysisResult, HistoryEntry } from "@/types/analysis";
import { captureFrameAsBlob } from "./useFrameCapture";

type AnalyzeCurrentFrameOptions = {
  frameDifference?: number | null;
  skippedAnalyses: number;
};

type UseAnalysisOptions = {
  mission: Ref<string>;
  videoRef: Ref<HTMLVideoElement | null>;
  canvasRef: Ref<HTMLCanvasElement | null>;
  announce: (message: string) => void;
};

export function useAnalysis({
  mission,
  videoRef,
  canvasRef,
  announce,
}: UseAnalysisOptions) {
  const result = ref("");
  const analyzing = ref(false);
  const lastAnalysisResult = ref<AnalysisResult | null>(null);
  const analysisHistory = ref<HistoryEntry[]>([]);
  let currentController: AbortController | null = null;
  let requestSequence = 0;

  function getCurrentTimeString(): string {
    const now = new Date();
    return now.toTimeString().split(" ")[0] ?? "";
  }

  function cancelAnalysis() {
    currentController?.abort();
    currentController = null;
    analyzing.value = false;
  }

  async function analyzeCurrentFrame({
    frameDifference = null,
    skippedAnalyses,
  }: AnalyzeCurrentFrameOptions): Promise<AnalysisResult | null> {
    if (!videoRef.value || !canvasRef.value) {
      return null;
    }

    currentController?.abort();
    const controller = new AbortController();
    currentController = controller;
    const requestId = ++requestSequence;
    const startedAt = performance.now();

    try {
      analyzing.value = true;

      const capturedFrame = await captureFrameAsBlob(
        videoRef.value,
        canvasRef.value,
      );
      const networkStartedAt = performance.now();

      const data = await analyzeFrame({
        mission: mission.value,
        image: capturedFrame.image,
        signal: controller.signal,
      });

      if (controller.signal.aborted || requestId !== requestSequence) {
        return null;
      }

      const parsed: AnalysisResult = {
        ...data,
        metrics: {
          captureMs: capturedFrame.captureMs,
          encodingMs: capturedFrame.encodingMs,
          uploadAndModelMs: performance.now() - networkStartedAt,
          totalMs: performance.now() - startedAt,
          imageBytes: capturedFrame.imageBytes,
          frameDifference,
          skippedAnalyses,
        },
      };

      result.value = JSON.stringify(parsed, null, 2);
      lastAnalysisResult.value = parsed;

      analysisHistory.value.unshift({
        time: getCurrentTimeString(),
        matched: parsed.matched,
        message: parsed.message || "Analyse effectuee",
        reason: parsed.reason,
      });

      if (analysisHistory.value.length > 5) {
        analysisHistory.value.pop();
      }

      return parsed;
    } catch (error) {
      if (controller.signal.aborted) {
        result.value = "Analyse annulee.";
        return null;
      }

      console.error("Erreur de requete analyze-frame:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Erreur de communication avec le serveur d'analyse.";
      result.value = `Erreur: ${message}`;
      announce("Erreur de communication avec le serveur d'analyse.");
      throw error;
    } finally {
      if (currentController === controller) {
        currentController = null;
        analyzing.value = false;
      }
    }
  }

  return {
    result,
    analyzing,
    lastAnalysisResult,
    analysisHistory,
    analyzeCurrentFrame,
    cancelAnalysis,
  };
}

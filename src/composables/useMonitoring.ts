import { ref, type Ref } from "vue";
import type { AnalysisResult } from "@/types/analysis";
import {
  calculateFrameDifference,
  captureFrameSample,
} from "./useFrameCapture";

type UseMonitoringOptions = {
  videoRef: Ref<HTMLVideoElement | null>;
  analyzeCurrentFrame: (options: {
    frameDifference?: number | null;
    skippedAnalyses: number;
  }) => Promise<AnalysisResult | null>;
  cancelAnalysis: () => void;
  announce: (message: string) => void;
  onAnalysis: (analysis: AnalysisResult) => void;
  onError: () => void;
};

const MINIMUM_INTERVAL_MS = 2_000;
const MINIMUM_DELAY_MS = 300;
const FORCE_ANALYSIS_AFTER_MS = 8_000;
const CHANGE_THRESHOLD = 0.025;

export function useMonitoring({
  videoRef,
  analyzeCurrentFrame,
  cancelAnalysis,
  announce,
  onAnalysis,
  onError,
}: UseMonitoringOptions) {
  const watching = ref(false);
  const skippedAnalyses = ref(0);
  let timerId: number | null = null;
  let previousSample: Uint8ClampedArray | null = null;
  let lastAnalysisAt = 0;

  function clearTimer() {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  }

  function stopWatching() {
    if (!watching.value) {
      return;
    }

    watching.value = false;
    clearTimer();
    cancelAnalysis();
    announce("Surveillance arretee.");
  }

  function shouldAnalyzeFrame(): number | null {
    if (!videoRef.value) {
      return null;
    }

    const currentSample = captureFrameSample(videoRef.value);
    if (!currentSample) {
      return null;
    }

    if (!previousSample) {
      previousSample = currentSample;
      return null;
    }

    const difference = calculateFrameDifference(previousSample, currentSample);
    previousSample = currentSample;
    return difference;
  }

  async function runMonitoringCycle() {
    if (!watching.value) {
      return;
    }

    const startedAt = performance.now();

    try {
      const difference = shouldAnalyzeFrame();
      const mustForce =
        !lastAnalysisAt || performance.now() - lastAnalysisAt >= FORCE_ANALYSIS_AFTER_MS;
      const shouldAnalyze =
        difference === null || difference >= CHANGE_THRESHOLD || mustForce;

      if (shouldAnalyze) {
        const analysis = await analyzeCurrentFrame({
          frameDifference: difference,
          skippedAnalyses: skippedAnalyses.value,
        });

        if (analysis) {
          lastAnalysisAt = performance.now();
          onAnalysis(analysis);
        }
      } else {
        skippedAnalyses.value += 1;
      }
    } catch {
      onError();
      stopWatching();
      return;
    } finally {
      if (!watching.value) {
        return;
      }

      const duration = performance.now() - startedAt;
      const nextDelay = Math.max(MINIMUM_DELAY_MS, MINIMUM_INTERVAL_MS - duration);
      timerId = window.setTimeout(runMonitoringCycle, nextDelay);
    }
  }

  function startWatching() {
    if (watching.value) {
      return;
    }

    watching.value = true;
    skippedAnalyses.value = 0;
    previousSample = null;
    lastAnalysisAt = 0;
    announce("Demarrage de la surveillance continue.");
    void runMonitoringCycle();
  }

  return {
    watching,
    skippedAnalyses,
    startWatching,
    stopWatching,
  };
}

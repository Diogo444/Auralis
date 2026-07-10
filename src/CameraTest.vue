<template>
  <section class="mission-screen" aria-label="Mission camera Auralis">
    <div class="sr-only" aria-live="assertive" role="status">
      {{ ariaAnnouncement }}
    </div>

    <video
      ref="videoRef"
      class="camera-video"
      autoplay
      playsinline
      muted
      aria-label="Flux video en direct pour la mission"
    ></video>
    <canvas ref="canvasRef" class="hidden-canvas" aria-hidden="true"></canvas>

    <div v-if="!cameraStream" class="camera-empty" aria-hidden="true">
      <span class="camera-empty-icon">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.9">
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.5-2h4l1.5 2h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
          <circle cx="12" cy="12.5" r="3.2" />
        </svg>
      </span>
    </div>

    <div class="camera-scrim" aria-hidden="true"></div>

    <div class="mission-overlay">
      <form class="mission-controls" @submit.prevent="toggleMission">
        <label class="sr-only" for="mission-field">Mission</label>
        <input
          id="mission-field"
          v-model="mission"
          class="mission-input"
          placeholder="Mission..."
          autocomplete="off"
          :disabled="watching"
          @keyup.enter="handleEnterKey"
        />

        <button
          type="submit"
          class="mission-button"
          :class="{ 'is-active': watching }"
          :disabled="!watching && !mission.trim()"
          :aria-pressed="watching"
        >
          <svg v-if="watching" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <path d="m8 5 10 7-10 7V5Z" />
          </svg>
          {{ watching ? "Arreter la mission" : "Commencer la mission" }}
        </button>

        <p v-if="analyzing" class="mission-state" aria-busy="true">
          <span class="loading-spinner" aria-hidden="true"></span>
          Analyse en cours...
        </p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import { useAnalysis } from "@/composables/useAnalysis";
import { useCamera } from "@/composables/useCamera";
import { useMonitoring } from "@/composables/useMonitoring";
import { useSpeech } from "@/composables/useSpeech";
import type { AnalysisResult } from "@/types/analysis";

const mission = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const { ariaAnnouncement, announce, speak } = useSpeech();

const {
  cameraStream,
  startCamera,
  stopCamera: stopCameraStream,
} = useCamera({
  videoRef,
  announce,
});

const {
  analyzing,
  analyzeCurrentFrame,
  cancelAnalysis,
} = useAnalysis({
  mission,
  videoRef,
  canvasRef,
  announce,
});

function handleAnalysis(analysis: AnalysisResult) {
  const textAnnouncement = analysis.message || "Analyse terminee.";
  announce(textAnnouncement);

  if (analysis.matched) {
    speak(textAnnouncement);
    stopWatching();
  }
}

const { watching, startWatching: startMonitoring, stopWatching } = useMonitoring({
  videoRef,
  analyzeCurrentFrame,
  cancelAnalysis,
  announce,
  onAnalysis: handleAnalysis,
  onError: () => speak("Erreur de communication avec le serveur d'analyse."),
});

async function toggleMission() {
  if (watching.value) {
    stopWatching();
    return;
  }

  if (!mission.value.trim()) {
    announce("Indique une mission avant de commencer.");
    return;
  }

  if (!cameraStream.value) {
    await startCamera();
    await nextTick();
  }

  if (cameraStream.value) {
    startMonitoring();
  }
}

function handleEnterKey() {
  void toggleMission();
}

onBeforeUnmount(() => {
  stopWatching();
  stopCameraStream();
});
</script>

<style scoped>
.mission-screen {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 26%, rgba(125, 211, 252, 0.13), transparent 16rem),
    #05070b;
}

.camera-video,
.camera-empty,
.camera-scrim {
  position: absolute;
  inset: 0;
}

.camera-video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: #05070b;
}

.hidden-canvas {
  display: none;
}

.camera-empty {
  display: grid;
  place-items: center;
  color: rgba(248, 250, 252, 0.62);
}

.camera-empty-icon {
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.62);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
}

.camera-scrim {
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(5, 7, 11, 0.2) 0%, rgba(5, 7, 11, 0.08) 44%, rgba(5, 7, 11, 0.92) 100%),
    linear-gradient(90deg, rgba(5, 7, 11, 0.16), transparent 32%, transparent 68%, rgba(5, 7, 11, 0.16));
}

.mission-overlay {
  position: relative;
  z-index: 2;
  min-height: 100svh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: clamp(1rem, 3.5vw, 2rem);
}

.mission-controls {
  width: min(100%, 520px);
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  background: rgba(8, 13, 22, 0.72);
  box-shadow: 0 26px 90px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(22px);
}

.mission-input {
  width: 100%;
  min-height: 58px;
  padding: 0 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.96);
  color: #07111d;
  font-size: 1rem;
  font-weight: 750;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.mission-input::placeholder {
  color: #64748b;
}

.mission-input:disabled {
  opacity: 0.86;
}

.mission-button {
  min-height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0 1.1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--accent-active), var(--accent-active-strong));
  color: #04110d;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0;
  box-shadow: 0 18px 42px rgba(16, 185, 129, 0.28);
  transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.mission-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 22px 54px rgba(16, 185, 129, 0.34);
}

.mission-button:active:not(:disabled) {
  transform: translateY(1px) scale(0.99);
}

.mission-button.is-active {
  background: linear-gradient(135deg, var(--accent-stop), var(--accent-stop-strong));
  color: #ffffff;
  box-shadow: 0 18px 42px rgba(244, 63, 94, 0.3);
}

.mission-button.is-active:hover {
  box-shadow: 0 22px 54px rgba(244, 63, 94, 0.36);
}

.mission-state {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
}

.loading-spinner {
  width: 17px;
  height: 17px;
  border: 3px solid rgba(255, 255, 255, 0.16);
  border-top-color: var(--accent-active);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@media (min-width: 760px) {
  .mission-overlay {
    justify-content: flex-end;
  }
}

@media (max-width: 420px) {
  .mission-overlay {
    padding: 0.85rem;
  }

  .mission-controls {
    border-radius: 22px;
  }

  .mission-input,
  .mission-button {
    min-height: 56px;
    border-radius: 17px;
  }
}
</style>

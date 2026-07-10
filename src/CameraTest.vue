<template>
  <div class="auralis-workspace">
    <div class="sr-only" aria-live="assertive" role="status">
      {{ ariaAnnouncement }}
    </div>

    <section class="intro-panel" aria-labelledby="auralis-title">
      <div class="intro-copy">
        <h2 id="auralis-title">Gardons un oeil attentif, sans stress.</h2>
        <p>
          Décris ce qu'Auralis doit repérer, lance la caméra, puis laisse
          l'assistant observer avec toi.
        </p>
      </div>

      <div class="status-cluster" aria-label="Etat de l'application">
        <span class="status-pill" :class="cameraStream ? 'is-ready' : 'is-muted'">
          <span class="status-dot" aria-hidden="true"></span>
          {{ cameraStream ? "Camera prete" : "Camera en attente" }}
        </span>
        <span class="status-pill" :class="watching ? 'is-watching' : 'is-muted'">
          <span class="status-dot" aria-hidden="true"></span>
          {{ watching ? "Surveillance active" : "Mission inactive" }}
        </span>
      </div>
    </section>

    <div class="workspace-grid">
      <section class="camera-panel" aria-labelledby="camera-title">
        <div class="panel-heading">
          <div>
            <h3 id="camera-title">Vue camera</h3>
            <p>Le flux reste local jusqu'a l'envoi d'une analyse.</p>
          </div>
          <span class="live-label" :class="{ active: cameraStream }">
            {{ cameraStream ? "En direct" : "Hors ligne" }}
          </span>
        </div>

        <div class="video-viewport" :class="{ 'camera-inactive': !cameraStream }">
          <video ref="videoRef" autoplay playsinline muted aria-label="Flux video en direct pour la surveillance"></video>
          <canvas ref="canvasRef" class="hidden-canvas" aria-hidden="true"></canvas>
          <div class="scanline" v-if="watching && cameraStream" aria-hidden="true"></div>

          <div class="viewport-placeholder" v-if="!cameraStream">
            <span class="placeholder-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.5-2h4l1.5 2h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
                <circle cx="12" cy="12.5" r="3.2" />
              </svg>
            </span>
            <strong>Camera non activee</strong>
            <span>Active-la quand tu es pret a commencer.</span>
          </div>
        </div>

        <div class="camera-actions">
          <button type="button" class="btn camera-toggle" :class="cameraStream ? 'btn-danger' : 'btn-primary'" @click="cameraStream ? stopCamera() : startCamera()">
            <svg v-if="cameraStream" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <rect x="5" y="5" width="14" height="14" rx="3" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <path d="m8 5 10 7-10 7V5Z" />
            </svg>
            {{ cameraStream ? "Eteindre la camera" : "Activer la camera" }}
          </button>
        </div>
      </section>

      <aside class="mission-panel" aria-labelledby="mission-title">
        <div class="panel-heading compact">
          <div>
            <h3 id="mission-title">Mission</h3>
            <p>Une phrase simple suffit.</p>
          </div>
        </div>

        <div class="mission-input-group">
          <label for="mission-field">Que dois-je reperer ?</label>
          <div class="input-container">
            <input
              id="mission-field"
              v-model="mission"
              placeholder="Ex: dis-moi quand tu vois mes cles"
              class="mission-input"
              aria-describedby="mission-desc"
              @keyup.enter="handleEnterKey"
            />
            <button v-if="mission" type="button" class="btn-clear" @click="mission = ''" aria-label="Effacer le champ">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p id="mission-desc" class="input-help-text">
            Auralis parlera seulement quand le resultat est utile.
          </p>
        </div>

        <div class="suggestions-container">
          <h4>Idees rapides</h4>
          <div class="suggestions-list" role="group" aria-label="Missions predefinies rapides">
            <button v-for="suggestion in suggestions" :key="suggestion" type="button" class="tag-btn" @click="setMission(suggestion)">
              {{ suggestion }}
            </button>
          </div>
        </div>

        <div class="monitoring-actions">
          <div class="main-action-buttons">
            <button type="button" class="btn btn-success" :disabled="!cameraStream || !mission || watching" @click="startWatching">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                <path d="m8 5 10 7-10 7V5Z" />
              </svg>
              Surveiller
            </button>
            <button type="button" class="btn btn-warning" :disabled="!watching" @click="stopWatching">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Arreter
            </button>
          </div>

          <button type="button" class="btn btn-secondary" :disabled="!cameraStream || !mission || watching" @click="triggerSingleAnalysis">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Analyse ponctuelle
          </button>
        </div>

        <label class="speech-toggle" for="speech-toggle">
          <input type="checkbox" id="speech-toggle" v-model="speakResults" />
          <span aria-hidden="true"></span>
          Vocaliser les alertes
        </label>

        <div class="monitoring-status-container" :class="{ active: watching }">
          <div class="status-row">
            <span>Etat de la mission</span>
            <strong>{{ watching ? "Observation en cours" : "Prete a demarrer" }}</strong>
          </div>
          <div v-if="analyzing" class="analysis-status-message" aria-busy="true">
            <span class="loading-spinner" aria-hidden="true"></span>
            <span>Gemini analyse l'image...</span>
          </div>
        </div>
      </aside>
    </div>

    <section class="results-section" aria-labelledby="results-section-title">
      <div class="section-heading">
        <h3 id="results-section-title">Derniere reponse</h3>
        <p>Le retour de l'analyse apparait ici des qu'il est disponible.</p>
      </div>

      <div class="results-layout-grid">
        <article class="result-card" :class="lastAnalysisResult?.matched ? 'card-match-found' : 'card-match-searching'">
          <div v-if="lastAnalysisResult" class="result-content">
            <div class="result-card-header">
              <span class="match-indicator">
                {{ lastAnalysisResult.matched ? "Objectif repere" : "Recherche en cours" }}
              </span>
              <span class="confidence-indicator">
                {{ Math.round((lastAnalysisResult.confidence ?? 0) * 100) }}% confiance
              </span>
            </div>
            <p class="result-message">{{ lastAnalysisResult.message }}</p>
            <p class="result-details" v-if="lastAnalysisResult.reason">{{ lastAnalysisResult.reason }}</p>
            <div class="meter-track" aria-hidden="true">
              <div class="meter-fill" :style="{ width: ((lastAnalysisResult.confidence ?? 0) * 100) + '%' }"></div>
            </div>
          </div>

          <div v-else class="empty-result">
            <strong>Aucune analyse pour l'instant</strong>
            <span>Active une mission ou lance une analyse ponctuelle.</span>
          </div>
        </article>

        <article class="logs-card">
          <div class="logs-header">
            <h4>Historique</h4>
            <span>{{ analysisHistory.length }}/5</span>
          </div>
          <ul class="logs-list" v-if="analysisHistory.length">
            <li v-for="(log, idx) in analysisHistory" :key="idx" class="log-item" :class="{ 'log-match': log.matched }">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-text">{{ log.message || log.reason || "Analyse effectuee" }}</span>
            </li>
          </ul>
          <p v-else class="empty-history">Les derniers scans s'afficheront ici.</p>

          <details class="debug-details" v-if="result">
            <summary>Données brutes</summary>
            <pre><code>{{ result }}</code></pre>
          </details>
        </article>
      </div>
    </section>

    <details class="diagnostic-panel">
      <summary>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.3" aria-hidden="true">
          <path d="M4 5h16v11H4z" />
          <path d="M9 20h6M12 16v4" />
        </svg>
        Diagnostic camera
      </summary>
      <div class="diagnostic-content">
        <div class="diag-meta">
          <div><strong>isSecureContext :</strong> <span :class="isSecure ? 'text-success' : 'text-danger'">{{ isSecure ? "true" : "false" }}</span></div>
          <div class="ua-row"><strong>UserAgent :</strong> <span class="meta-ua">{{ navigatorUserAgent }}</span></div>
        </div>

        <div class="diag-devices" v-if="deviceList.length">
          <strong>Appareils detectes :</strong>
          <ul class="device-ul">
            <li v-for="(dev, idx) in deviceList" :key="idx">{{ dev }}</li>
          </ul>
        </div>

        <div class="diag-logs">
          <strong>Logs temps reel :</strong>
          <div class="logs-console">
            <div v-for="(log, idx) in diagnosticLogs" :key="idx" class="log-line">{{ log }}</div>
            <div v-if="!diagnosticLogs.length" class="log-placeholder">Aucun log pour le moment.</div>
          </div>
        </div>

        <div class="diag-actions">
          <button type="button" class="btn btn-secondary btn-sm" @click="clearDiagnosticLogs">Effacer les logs</button>
          <button type="button" class="btn btn-secondary btn-sm" @click="checkDevices">Actualiser les appareils</button>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { useAnalysis } from "@/composables/useAnalysis";
import { useCamera } from "@/composables/useCamera";
import { useMonitoring } from "@/composables/useMonitoring";
import { useSpeech } from "@/composables/useSpeech";
import type { AnalysisResult } from "@/types/analysis";

const mission = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const suggestions = [
  "Dis-moi quand tu vois un ecran",
  "Reperer mes cles",
  "Trouver ma tasse",
  "Y a-t-il quelqu'un devant moi ?",
  "Est-ce que la porte est ouverte ?",
];

const { ariaAnnouncement, speakResults, announce, speak } = useSpeech();

const {
  cameraStream,
  diagnosticLogs,
  isSecure,
  deviceList,
  navigatorUserAgent,
  clearDiagnosticLogs,
  checkDevices,
  startCamera,
  stopCamera: stopCameraStream,
} = useCamera({
  videoRef,
  announce,
});

const {
  result,
  analyzing,
  lastAnalysisResult,
  analysisHistory,
  analyzeCurrentFrame,
  cancelAnalysis,
} = useAnalysis({
  mission,
  videoRef,
  canvasRef,
  announce,
});

function setMission(text: string) {
  mission.value = text;
  announce(`Mission definie sur : ${text}`);
}

function stopCamera() {
  if (watching.value) {
    stopWatching();
  }

  stopCameraStream();
}

function handleAnalysis(analysis: AnalysisResult) {
  const textAnnouncement = analysis.message || "Analyse terminee.";
  announce(textAnnouncement);

  if (analysis.matched) {
    speak(textAnnouncement);
    stopWatching();
  }
}

const { watching, skippedAnalyses, startWatching: startMonitoring, stopWatching } = useMonitoring({
  videoRef,
  analyzeCurrentFrame,
  cancelAnalysis,
  announce,
  onAnalysis: handleAnalysis,
  onError: () => speak("Erreur de communication avec le serveur d'analyse."),
});

async function triggerSingleAnalysis() {
  if (!cameraStream.value || !mission.value || watching.value) return;
  announce("Lancement d'une analyse ponctuelle.");

  try {
    const analysis = await analyzeCurrentFrame({
      frameDifference: null,
      skippedAnalyses: skippedAnalyses.value,
    });

    if (analysis) {
      const textAnnouncement = analysis.message || "Analyse unique terminee.";
      speak(textAnnouncement);
      announce(textAnnouncement);
    }
  } catch {
    speak("Erreur de communication avec le serveur d'analyse.");
  }
}

function startWatching() {
  if (!cameraStream.value || !mission.value || watching.value) {
    return;
  }

  startMonitoring();
}

function handleEnterKey() {
  if (cameraStream.value && mission.value && !watching.value) {
    startWatching();
  }
}

onBeforeUnmount(() => {
  stopWatching();
  stopCameraStream();
});
</script>

<style scoped>
.auralis-workspace {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.intro-panel,
.camera-panel,
.mission-panel,
.results-section,
.diagnostic-panel {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(219, 231, 238, 0.9);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.intro-panel {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.4rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(234, 248, 255, 0.9)),
    linear-gradient(90deg, rgba(255, 189, 74, 0.18), rgba(22, 166, 122, 0.08));
}

.intro-copy h2 {
  max-width: 680px;
  font-size: clamp(1.75rem, 3vw, 3.1rem);
  line-height: 1.02;
  letter-spacing: 0;
  font-weight: 930;
}

.intro-copy p {
  max-width: 640px;
  margin-top: 0.65rem;
  color: var(--text-secondary);
  font-size: 1.05rem;
  font-weight: 560;
}

.status-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: flex-end;
}

.status-pill,
.live-label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 36px;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-round);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.status-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: currentColor;
}

.status-pill.is-ready,
.live-label.active {
  background: var(--accent-mint-soft);
  border-color: rgba(16, 143, 103, 0.24);
  color: var(--success);
}

.status-pill.is-watching {
  background: var(--accent-sun-soft);
  border-color: rgba(255, 189, 74, 0.42);
  color: var(--warning);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(330px, 0.72fr);
  gap: 1.15rem;
  align-items: start;
}

.camera-panel,
.mission-panel,
.results-section,
.diagnostic-panel {
  padding: 1.15rem;
}

.panel-heading,
.section-heading,
.logs-header,
.result-card-header,
.status-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.panel-heading h3,
.section-heading h3,
.logs-header h4,
.suggestions-container h4 {
  font-size: 1.02rem;
  font-weight: 880;
  letter-spacing: 0;
}

.panel-heading p,
.section-heading p,
.input-help-text,
.empty-history,
.empty-result span {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 540;
}

.video-viewport {
  position: relative;
  width: 100%;
  margin-top: 1rem;
  overflow: hidden;
  background: #101820;
  border: 1px solid #152632;
  border-radius: 16px;
  aspect-ratio: 16 / 9;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.video-viewport video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hidden-canvas {
  display: none;
}

.scanline {
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255, 189, 74, 0.92), rgba(22, 166, 122, 0.78), transparent);
  box-shadow: 0 0 20px rgba(255, 189, 74, 0.5);
  animation: scan 2.8s linear infinite;
}

.viewport-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  padding: 1.4rem;
  color: #dcecf5;
  text-align: center;
  background:
    linear-gradient(135deg, rgba(14, 36, 49, 0.96), rgba(17, 64, 83, 0.92)),
    radial-gradient(circle at center, rgba(255, 189, 74, 0.25), transparent 16rem);
}

.placeholder-icon {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  margin-bottom: 0.35rem;
  color: #aee2ff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 22px;
}

.camera-actions {
  margin-top: 1rem;
}

.btn {
  width: 100%;
  padding: 0.78rem 1rem;
}

.btn-primary {
  background: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(24, 140, 207, 0.24);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.btn-danger {
  background: var(--accent-coral);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(255, 123, 97, 0.22);
}

.btn-success {
  background: var(--accent-mint);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(22, 166, 122, 0.2);
}

.btn-warning {
  background: var(--accent-sun);
  color: #412900;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.mission-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-container {
  position: relative;
}

.mission-input {
  width: 100%;
  min-height: 54px;
  padding: 0.9rem 3rem 0.9rem 1rem;
  color: var(--text-primary);
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 650;
  box-shadow: inset 0 1px 0 rgba(22, 36, 47, 0.03);
}

.mission-input::placeholder {
  color: var(--text-muted);
}

.btn-clear {
  position: absolute;
  top: 50%;
  right: 0.45rem;
  width: 40px;
  min-height: 40px;
  padding: 0;
  color: var(--text-secondary);
  background: transparent;
  transform: translateY(-50%);
}

.suggestions-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  min-height: 36px;
  padding: 0.45rem 0.72rem;
  background: var(--accent-primary-light);
  border: 1px solid rgba(24, 140, 207, 0.18);
  color: #0e5e88;
  font-size: 0.84rem;
  font-weight: 760;
}

.tag-btn:hover {
  background: #ccefff;
}

.monitoring-actions {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.main-action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}

.speech-toggle {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 0.65rem;
  margin: 0;
  padding: 0.78rem;
  background: var(--accent-coral-soft);
  border: 1px solid rgba(255, 123, 97, 0.18);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.92rem;
  cursor: pointer;
}

.speech-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.speech-toggle span {
  width: 44px;
  height: 26px;
  position: relative;
  border-radius: var(--radius-round);
  background: #ffffff;
  border: 1px solid rgba(255, 123, 97, 0.35);
}

.speech-toggle span::after {
  content: "";
  position: absolute;
  top: 4px;
  left: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-coral);
  transition: transform 0.18s ease;
}

.speech-toggle input:checked + span::after {
  transform: translateX(18px);
}

.monitoring-status-container {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
  background: var(--bg-soft);
  border: 1px solid rgba(24, 140, 207, 0.16);
  border-radius: var(--radius-sm);
}

.monitoring-status-container.active {
  background: var(--accent-sun-soft);
  border-color: rgba(255, 189, 74, 0.42);
}

.status-row {
  font-size: 0.9rem;
}

.status-row span {
  color: var(--text-secondary);
}

.status-row strong {
  color: var(--text-primary);
}

.analysis-status-message {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 650;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(24, 140, 207, 0.16);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.results-section {
  display: grid;
  gap: 1rem;
}

.results-layout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.62fr);
  gap: 1rem;
}

.result-card,
.logs-card {
  min-height: 180px;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.card-match-found {
  background: linear-gradient(135deg, #ffffff 0%, var(--accent-mint-soft) 100%);
  border-color: rgba(16, 143, 103, 0.28);
}

.match-indicator {
  color: var(--success);
  font-weight: 900;
}

.card-match-searching .match-indicator {
  color: var(--text-secondary);
}

.confidence-indicator,
.logs-header span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.3rem 0.55rem;
  color: var(--text-secondary);
  background: var(--bg-soft);
  border-radius: var(--radius-round);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.result-message {
  margin-top: 1rem;
  color: var(--text-primary);
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  line-height: 1.18;
  font-weight: 880;
}

.result-details {
  margin-top: 0.75rem;
  color: var(--text-secondary);
  font-weight: 560;
}

.meter-track {
  height: 9px;
  margin-top: 1rem;
  overflow: hidden;
  background: #edf5f9;
  border-radius: var(--radius-round);
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-mint));
  border-radius: inherit;
}

.empty-result {
  height: 100%;
  min-height: 148px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.4rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-result strong {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.logs-card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.logs-list {
  display: grid;
  gap: 0.55rem;
  list-style: none;
}

.log-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: center;
  padding: 0.6rem;
  background: var(--bg-soft);
  border: 1px solid rgba(24, 140, 207, 0.1);
  border-radius: var(--radius-sm);
}

.log-match {
  background: var(--accent-mint-soft);
}

.log-time {
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.78rem;
  font-weight: 800;
}

.log-text {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 0.88rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debug-details {
  margin-top: auto;
  color: var(--text-secondary);
}

.debug-details summary {
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
}

.debug-details pre {
  max-height: 150px;
  margin-top: 0.6rem;
  overflow: auto;
  padding: 0.75rem;
  background: #102434;
  border-radius: var(--radius-sm);
  color: #d7f4ff;
  font-size: 0.78rem;
}

.diagnostic-panel {
  padding: 0.95rem 1rem;
}

.diagnostic-panel summary {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 850;
}

.diagnostic-content {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.diag-meta,
.logs-console,
.device-ul li {
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.meta-ua,
.log-line {
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.78rem;
}

.device-ul {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.45rem;
  list-style: none;
}

.logs-console {
  max-height: 150px;
  margin-top: 0.45rem;
  overflow: auto;
  background: #102434;
  color: #d7f4ff;
}

.log-placeholder {
  color: #b8d7e7;
}

.diag-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn-sm {
  width: auto;
  min-height: 38px;
  padding: 0.55rem 0.75rem;
  font-size: 0.82rem;
}

.text-success {
  color: var(--success);
}

.text-danger {
  color: var(--error);
}

@media (max-width: 980px) {
  .intro-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .status-cluster {
    justify-content: flex-start;
  }

  .workspace-grid,
  .results-layout-grid {
    grid-template-columns: 1fr;
  }

  .mission-panel {
    order: -1;
  }
}

@media (max-width: 640px) {
  .intro-panel,
  .camera-panel,
  .mission-panel,
  .results-section,
  .diagnostic-panel {
    border-radius: 14px;
  }

  .intro-panel,
  .camera-panel,
  .mission-panel,
  .results-section {
    padding: 0.9rem;
  }

  .intro-copy h2 {
    font-size: 1.8rem;
  }

  .panel-heading,
  .section-heading,
  .result-card-header,
  .status-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.45rem;
  }

  .video-viewport {
    border-radius: 12px;
    aspect-ratio: 4 / 3;
  }

  .main-action-buttons {
    grid-template-columns: 1fr;
  }

  .suggestions-list {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.2rem;
    scrollbar-width: none;
  }

  .suggestions-list::-webkit-scrollbar {
    display: none;
  }

  .tag-btn {
    flex: 0 0 auto;
  }

  .log-item {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}
</style>

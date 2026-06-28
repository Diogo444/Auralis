<template>
  <div class="surveillance-dashboard">
    <!-- Screen Reader Announcements (Aria Live) -->
    <div class="sr-only" aria-live="assertive" role="status">
      {{ ariaAnnouncement }}
    </div>

    <div class="dashboard-grid">
      <!-- Left Column: Camera and Viewport -->
      <section class="dashboard-card camera-card" aria-labelledby="camera-title">
        <div class="card-header">
          <h2 id="camera-title" class="section-title">
            <svg class="header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Flux Caméra en Temps Réel
          </h2>
          <span class="status-indicator-badge" :class="cameraStream ? 'badge-active' : 'badge-inactive'">
            <span class="status-dot" v-if="cameraStream"></span>
            {{ cameraStream ? "Caméra Active" : "Caméra Éteinte" }}
          </span>
        </div>

        <!-- Camera Viewport Container -->
        <div class="video-viewport" :class="{ 'camera-inactive': !cameraStream }">
          <video 
            ref="videoRef" 
            autoplay 
            playsinline 
            muted 
            aria-label="Flux vidéo en direct pour la surveillance"
          ></video>
          <canvas ref="canvasRef" class="hidden-canvas" aria-hidden="true"></canvas>

          <!-- Cyberpunk Scanning Line Animation (Disabled in reduced motion) -->
          <div class="scanline" v-if="watching && cameraStream" aria-hidden="true"></div>

          <!-- Video placeholder when camera is not started -->
          <div class="viewport-placeholder" v-if="!cameraStream">
            <div class="placeholder-icon-wrapper">
              <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <p class="placeholder-title">Matériel Caméra Déconnecté</p>
            <p class="placeholder-subtitle">Activez la caméra ci-dessous pour démarrer le traitement visuel.</p>
          </div>
        </div>

        <!-- Camera toggle button -->
        <div class="camera-actions">
          <button 
            type="button" 
            class="btn btn-full"
            :class="cameraStream ? 'btn-danger' : 'btn-primary'"
            @click="cameraStream ? stopCamera() : startCamera()"
          >
            <svg v-if="cameraStream" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {{ cameraStream ? "Éteindre la caméra" : "Activer la caméra" }}
          </button>
        </div>
      </section>

      <!-- Right Column: Mission Control -->
      <section class="dashboard-card control-card" aria-labelledby="mission-title">
        <h2 id="mission-title" class="section-title">
          <svg class="header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Objectif de Surveillance
        </h2>

        <!-- Mission Input -->
        <div class="mission-input-group">
          <label for="mission-field">Définir l'objet ou la scène à repérer</label>
          <div class="input-container">
            <input 
              id="mission-field"
              v-model="mission" 
              placeholder="Ex: des clés sur la table, un verre d'eau, une personne..." 
              class="mission-input"
              aria-describedby="mission-desc"
              @keyup.enter="handleEnterKey"
            />
            <button 
              v-if="mission"
              type="button" 
              class="btn-clear" 
              @click="mission = ''"
              aria-label="Effacer le champ"
              title="Effacer le texte saisi"
            >
              &times;
            </button>
          </div>
          <p id="mission-desc" class="input-help-text">
            Saisissez précisément la mission pour guider l'analyse de l'intelligence artificielle.
          </p>
        </div>

        <!-- Quick templates suggestions (RGAA/WCAG improvement) -->
        <div class="suggestions-container">
          <h3 class="suggestions-title">Suggestions rapides :</h3>
          <div class="suggestions-list" role="group" aria-label="Missions prédéfinies rapides">
            <button 
              v-for="suggestion in suggestions" 
              :key="suggestion"
              type="button"
              class="tag-btn"
              @click="setMission(suggestion)"
              :aria-label="'Remplir avec la suggestion : ' + suggestion"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- Actions Panel -->
        <div class="monitoring-actions">
          <div class="main-action-buttons">
            <button 
              type="button" 
              class="btn btn-success flex-1" 
              :disabled="!cameraStream || !mission || watching"
              @click="startWatching"
              title="Démarrer la surveillance continue automatique"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Activer Surveillance
            </button>
            <button 
              type="button" 
              class="btn btn-warning flex-1" 
              :disabled="!watching"
              @click="stopWatching"
              title="Arrêter la surveillance active"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
              </svg>
              Arrêter
            </button>
          </div>
          
          <button 
            type="button" 
            class="btn btn-secondary btn-full"
            :disabled="!cameraStream || !mission || watching"
            @click="triggerSingleAnalysis"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Analyser l'instant unique
          </button>
        </div>

        <!-- Extra accessibility settings (Speech synthesis) -->
        <div class="speech-settings">
          <div class="toggle-control">
            <input 
              type="checkbox" 
              id="speech-toggle" 
              v-model="speakResults" 
              class="accessibility-checkbox"
            />
            <label for="speech-toggle" class="checkbox-label">
              <svg class="label-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              Vocalisation des alertes (Synthèse Vocale)
            </label>
          </div>
        </div>

        <!-- Monitoring Status Area -->
        <div class="monitoring-status-container" :class="{ 'status-active-pulse': watching }">
          <div class="status-row">
            <span>État global de la mission :</span>
            <strong :class="watching ? 'status-text-running' : 'status-text-stopped'">
              {{ watching ? "Surveillance Continue en Cours..." : "Inactive" }}
            </strong>
          </div>
          
          <div v-if="analyzing" class="analysis-status-message" aria-busy="true">
            <span class="loading-spinner" aria-hidden="true"></span>
            <span>Gemini analyse l'image actuelle...</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Results and Logs Section -->
    <section 
      class="results-logs-section" 
      aria-labelledby="results-section-title"
      v-if="lastAnalysisResult || analysisHistory.length"
    >
      <h2 id="results-section-title" class="results-section-title">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        Résultats de l'Analyse Visuelle
      </h2>

      <div class="results-layout-grid">
        <!-- Last Match Info -->
        <div 
          v-if="lastAnalysisResult" 
          class="card result-card" 
          :class="lastAnalysisResult.matched ? 'card-match-found' : 'card-match-searching'"
        >
          <div class="result-card-header">
            <span class="match-indicator">
              {{ lastAnalysisResult.matched ? "✓ Objectif Atteint" : "⌛ En Recherche..." }}
            </span>
            <span class="confidence-indicator">
              Indice de confiance : {{ Math.round((lastAnalysisResult.confidence ?? 0) * 100) }}%
            </span>
          </div>

          <p class="result-message">{{ lastAnalysisResult.message }}</p>
          
          <div class="result-details" v-if="lastAnalysisResult.reason">
            <strong>Explication IA : </strong>{{ lastAnalysisResult.reason }}
          </div>

          <!-- Custom confidence progress bar -->
          <div class="confidence-meter-container">
            <div class="meter-label sr-only">Confiance de l'analyse : {{ Math.round((lastAnalysisResult.confidence ?? 0) * 100) }}%</div>
            <div class="meter-track">
              <div 
                class="meter-fill" 
                :style="{ width: ((lastAnalysisResult.confidence ?? 0) * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- History and debug panel -->
        <div class="card logs-card" v-if="analysisHistory.length">
          <h3 class="logs-title">Historique des 5 derniers scans</h3>
          <ul class="logs-list">
            <li 
              v-for="(log, idx) in analysisHistory" 
              :key="idx" 
              class="log-item"
              :class="{ 'log-match': log.matched }"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-badge">{{ log.matched ? 'Cible Trouvée' : 'Recherche' }}</span>
              <span class="log-text">{{ log.message || log.reason || "Aucun message" }}</span>
            </li>
          </ul>

          <!-- W3C Accessible details expander -->
          <details class="debug-details">
            <summary class="debug-summary">Données brutes de débogage (JSON)</summary>
            <div class="debug-content">
              <pre><code>{{ result }}</code></pre>
            </div>
          </details>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

type AnalyzeResult = {
  raw?: string;
  matched?: boolean;
  confidence?: number;
  message?: string;
  reason?: string;
};

type HistoryEntry = {
  time: string;
  matched: boolean;
  message: string;
  reason?: string;
};

// Application states
const mission = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const result = ref("");
const watching = ref(false);
const analyzing = ref(false);
const cameraStream = ref<MediaStream | null>(null);

// Accessibility enhancements
const ariaAnnouncement = ref("");
const speakResults = ref(true);
const lastAnalysisResult = ref<AnalyzeResult | null>(null);
const analysisHistory = ref<HistoryEntry[]>([]);

// Predefined quick missions suggestions
const suggestions = [
  "Est-ce qu'il y a un chat ?",
  "Repérer mes clés de voiture",
  "Trouver ma tasse de café",
  "Y a-t-il quelqu'un devant moi ?",
  "Est-ce que la porte est ouverte ?"
];

// Helper to update current aria announcements for screen readers
function announce(message: string) {
  ariaAnnouncement.value = message;
}

// Set predefined suggestions
function setMission(text: string) {
  mission.value = text;
  announce(`Mission définie sur : ${text}`);
}

// Speak helper using Web Speech API
function speak(message: string) {
  if (!speakResults.value) return;
  try {
    speechSynthesis.cancel(); // Stop any pending vocalization
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Échec de la synthèse vocale :", err);
  }
}

// Time formatter for history log
function getCurrentTimeString(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0] ?? "";
}

// Start Camera Stream
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment", // Use rear camera on mobile phones by default!
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false,
    });

    cameraStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
    announce("Caméra démarrée avec succès.");
  } catch (err) {
    console.error("Impossible d'accéder à la caméra :", err);
    announce("Erreur d'accès à la caméra. Veuillez autoriser les permissions.");
    alert("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
  }
}

// Stop Camera Stream (releasing hardware)
function stopCamera() {
  if (watching.value) {
    stopWatching();
  }
  
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
  }
  
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  announce("Caméra désactivée.");
}

// Extract JSON content returned from Gemini model response
function extractJsonFromRaw(raw: string) {
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

// Capture current frame and post it to Express server
async function sendFrame(): Promise<AnalyzeResult | null> {
  if (!videoRef.value || !canvasRef.value) return null;

  const video = videoRef.value;
  const canvas = canvasRef.value;

  if (!video.videoWidth || !video.videoHeight) {
    result.value = "La caméra n'est pas prête.";
    announce("La caméra n'est pas prête.");
    return null;
  }

  // Draw frame on canvas with maximum width of 512px to optimize API upload size
  canvas.width = 512;
  canvas.height = Math.round((video.videoHeight / video.videoWidth) * 512);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  const imageBase64 = dataUrl.split(",")[1] ?? "";

  try {
    analyzing.value = true;
    const response = await fetch("http://localhost:3000/analyze-frame", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mission: mission.value,
        imageBase64,
        mimeType: "image/jpeg",
      }),
    });

    if (!response.ok) {
      throw new Error(`Serveur injoignable (Status ${response.status})`);
    }

    const data = await response.json();
    let parsed: AnalyzeResult = {};

    if (typeof data.raw === "string") {
      try {
        parsed = extractJsonFromRaw(data.raw);
      } catch {
        // Fallback if formatting was slightly off
        parsed = {
          matched: false,
          confidence: 0,
          message: data.raw,
          reason: "Format de réponse inattendu"
        };
      }
    } else {
      parsed = data;
    }

    // Update results values
    result.value = JSON.stringify(parsed, null, 2);
    lastAnalysisResult.value = parsed;

    // Add entry to history log (keep only last 5 logs)
    const newEntry: HistoryEntry = {
      time: getCurrentTimeString(),
      matched: parsed.matched ?? false,
      message: parsed.message ?? "Analyse effectuée",
      reason: parsed.reason
    };
    analysisHistory.value.unshift(newEntry);
    if (analysisHistory.value.length > 5) {
      analysisHistory.value.pop();
    }

    return parsed;
  } catch (error: any) {
    console.error("Erreur de requête analyze-frame:", error);
    const errorMessage = "Erreur de communication avec le serveur d'analyse.";
    result.value = `Erreur: ${error.message || error}`;
    
    // Vocalize error and announce to screen readers
    speak(errorMessage);
    announce(errorMessage);
    
    // Stop continuous watching loop in case of error
    stopWatching();
    return null;
  } finally {
    analyzing.value = false;
  }
}

// Start continuous watching loop
async function startWatching() {
  if (watching.value) return;
  if (!cameraStream.value || !mission.value) return;

  watching.value = true;
  announce("Démarrage de la surveillance continue.");

  while (watching.value) {
    const analysis = await sendFrame();

    if (analysis) {
      // Announce the match or the result summary
      const textAnnouncement = analysis.message || "Analyse terminée.";
      announce(textAnnouncement);

      if (analysis.matched) {
        speak(textAnnouncement);
        stopWatching();
        break;
      }
    }

    // Wait 1.5 seconds between analysis frames (instead of 1s to prevent overloading backend API)
    await wait(1500);
  }
}

// Stop continuous watching loop
function stopWatching() {
  if (!watching.value) return;
  watching.value = false;
  announce("Surveillance arrêtée.");
}

// Single analysis triggered manually by user
async function triggerSingleAnalysis() {
  if (!cameraStream.value || !mission.value || watching.value) return;
  announce("Lancement d'une analyse ponctuelle.");
  
  const analysis = await sendFrame();
  if (analysis) {
    const textAnnouncement = analysis.message || "Analyse unique terminée.";
    speak(textAnnouncement);
    announce(textAnnouncement);
  }
}

// Trigger monitoring when pressing Enter key inside text input
function handleEnterKey() {
  if (cameraStream.value && mission.value && !watching.value) {
    startWatching();
  }
}

// Small timing helper
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
</script>

<style scoped>
.surveillance-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  align-items: start;
}

.dashboard-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.header-icon {
  color: var(--accent-primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

/* Status badge */
.status-indicator-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: var(--radius-round);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid currentColor;
}

.badge-active {
  background-color: var(--success-bg);
  color: var(--success);
}

.badge-inactive {
  background-color: rgba(113, 113, 122, 0.1);
  color: var(--text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--success);
  box-shadow: 0 0 8px var(--success);
  animation: pulse-ring 1.8s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

/* Camera Viewport */
.video-viewport {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000000;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
}

.video-viewport video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden-canvas {
  display: none;
}

/* Scanline animation */
.scanline {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(
    to bottom,
    rgba(99, 102, 241, 0) 0%,
    rgba(99, 102, 241, 0.7) 50%,
    rgba(99, 102, 241, 0) 100%
  );
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
  z-index: 2;
  animation: scan 3s linear infinite;
  pointer-events: none;
}

.viewport-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  background-color: #050507;
  color: var(--text-secondary);
  z-index: 1;
}

.placeholder-icon-wrapper {
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-round);
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
}

.placeholder-icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
}

.placeholder-title {
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.placeholder-subtitle {
  font-size: 0.85rem;
  max-width: 280px;
}

/* Forms & Text Fields */
.mission-input-group {
  display: flex;
  flex-direction: column;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.mission-input {
  width: 100%;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 14px 44px 14px 16px;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.mission-input:focus {
  border-color: var(--border-focus);
}

.btn-clear {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: auto;
}

.btn-clear:hover {
  color: var(--text-primary);
}

.input-help-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* Predefined mission suggestions */
.suggestions-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-btn {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-round);
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px; /* Touch target optimized */
}

.tag-btn:hover {
  background-color: var(--bg-surface-elevated);
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

/* Buttons configuration */
.btn {
  font-size: 0.95rem;
  text-align: center;
  white-space: nowrap;
}

.btn-full {
  width: 100%;
}

.btn-primary {
  background-color: var(--accent-primary);
  color: #000000;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--accent-primary-light);
}

.btn-danger {
  background-color: var(--error);
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #ef4444e0;
}

.btn-success {
  background-color: var(--success);
  color: #000000;
}

.btn-success:hover:not(:disabled) {
  background-color: #34d399;
}

.btn-warning {
  background-color: var(--warning);
  color: #000000;
}

.btn-warning:hover:not(:disabled) {
  background-color: #fbbf24;
}

.btn-secondary {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: #323235;
}

.monitoring-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-action-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.flex-1 {
  flex: 1;
}

/* Accessibility settings toggle */
.speech-settings {
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
}

.switch-container {
  display: flex;
  align-items: center;
}

.toggle-control {
  display: flex;
  align-items: center;
  position: relative;
}

.accessibility-checkbox {
  width: 22px;
  height: 22px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-color);
  background-color: var(--bg-primary);
  margin-right: 10px;
  accent-color: var(--accent-primary);
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  user-select: none;
  font-size: 0.9rem;
  margin-bottom: 0;
}

.label-icon {
  color: var(--text-secondary);
}

/* Status container */
.monitoring-status-container {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-active-pulse {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.05);
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.status-text-running {
  color: var(--warning);
  font-weight: 700;
  animation: pulse-active 2s infinite ease-in-out;
}

.status-text-stopped {
  color: var(--text-secondary);
  font-weight: 700;
}

.analysis-status-message {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Results section */
.results-logs-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.results-section-title {
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.results-layout-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 24px;
}

.card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.3s ease;
}

.card-match-found {
  border-color: var(--success);
  background: linear-gradient(180deg, var(--bg-surface) 0%, var(--success-bg) 100%);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
}

.card-match-searching {
  border-color: var(--border-color);
  background: var(--bg-surface);
}

.result-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.match-indicator {
  font-weight: 800;
  font-size: 1.05rem;
}

.card-match-found .match-indicator {
  color: var(--success);
}

.card-match-searching .match-indicator {
  color: var(--text-muted);
}

.confidence-indicator {
  font-size: 0.85rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  padding: 4px 10px;
  border-radius: var(--radius-round);
  font-weight: 600;
  color: var(--text-primary);
}

.result-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.result-details {
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--accent-primary-light);
}

/* Confidence meter bar */
.confidence-meter-container {
  display: flex;
  flex-direction: column;
}

.meter-track {
  height: 6px;
  background-color: var(--bg-primary);
  border-radius: var(--radius-round);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.meter-fill {
  height: 100%;
  border-radius: var(--radius-round);
  background-color: var(--accent-primary-light);
  transition: width 0.3s ease;
}

.card-match-found .meter-fill {
  background-color: var(--success);
}

/* History logs */
.logs-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logs-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logs-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-match {
  border-color: var(--success);
  background-color: var(--success-bg);
}

.log-time {
  color: var(--text-muted);
  font-family: monospace;
}

.log-badge {
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.log-match .log-badge {
  color: var(--success);
}

.log-text {
  color: var(--text-primary);
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Technical debug Details panel */
.debug-details {
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
  margin-top: auto;
}

.debug-summary {
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
  font-weight: 600;
}

.debug-summary:hover {
  color: var(--text-secondary);
}

.debug-content {
  margin-top: 10px;
  max-height: 150px;
  overflow-y: auto;
}

.json-viewer {
  font-family: monospace;
  font-size: 0.75rem;
  background-color: #050507;
  color: #a3e635; /* Lime green */
  padding: 12px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  border: 1px solid var(--border-color);
}

/* Adaptive Responsiveness queries */
@media (max-width: 1024px) {
  .surveillance-dashboard {
    gap: 20px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .dashboard-card {
    padding: 20px;
    gap: 16px;
  }

  .results-logs-section {
    gap: 14px;
    margin-top: 8px;
  }

  .results-layout-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .video-viewport {
    max-height: 320px;
  }
}

@media (max-width: 480px) {
  .surveillance-dashboard {
    gap: 0;
  }

  .dashboard-grid {
    gap: 0;
  }

  .dashboard-card {
    padding: 20px 16px;
    background-color: transparent;
    border: none;
    box-shadow: none;
    border-radius: 0;
    gap: 16px;
  }

  .camera-card {
    padding: 0;
  }

  .section-title {
    font-size: 1.15rem;
    padding: 16px 16px 0 16px;
  }

  .video-viewport {
    aspect-ratio: 16 / 10;
    max-height: 240px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .camera-actions {
    padding: 0 16px 16px 16px;
  }

  .control-card {
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    padding: 24px 16px;
  }

  /* Horizontal swipe suggestions for touchscreens */
  .suggestions-list {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 6px;
    margin-right: -16px; /* Align scroll boundary to screen edge */
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  
  .suggestions-list::-webkit-scrollbar {
    display: none;
  }

  .tag-btn {
    flex: 0 0 auto;
    padding: 8px 14px;
    font-size: 0.85rem;
  }

  .main-action-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn {
    width: 100%;
    padding: 14px;
  }

  .results-logs-section {
    padding: 24px 16px;
    margin-top: 0;
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-primary);
  }

  .results-layout-grid {
    gap: 16px;
  }

  .results-logs-section .card {
    padding: 16px 12px;
  }

  .result-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .confidence-indicator {
    align-self: flex-start;
  }

  .result-message {
    font-size: 1rem;
  }

  .result-details {
    font-size: 0.85rem;
    padding: 10px;
  }
}
</style>
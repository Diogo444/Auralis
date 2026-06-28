<template>
  <div 
    class="app-wrapper" 
    :class="{ 
      'theme-high-contrast': isHighContrast, 
      'no-animations': reducedAnimations 
    }"
    :style="{ '--font-scale': fontScale }"
  >
    <!-- Skip Link (Lien d'évitement) - RGAA/W3C core requirement -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
    </a>

    <!-- Header Section -->
    <header class="app-header" role="banner">
      <div class="header-container">
        <div class="brand">
          <svg class="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
            <path d="M12 6C9.79 6 8 7.79 8 10C8 11.38 8.7 12.59 9.75 13.31L8.5 18H15.5L14.25 13.31C15.3 12.59 16 11.38 16 10C16 7.79 14.21 6 12 6ZM12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12Z" fill="currentColor"/>
          </svg>
          <div class="brand-text">
            <h1>Auralis</h1>
            <span class="tagline">Surveillance Assistée par IA</span>
          </div>
        </div>

        <!-- Header Actions: Accessibility Toggle Icon Button -->
        <div class="header-actions">
          <button 
            type="button" 
            class="control-btn toggle-settings-btn"
            :class="{ 'active': showAccSettings }"
            @click="showAccSettings = !showAccSettings"
            :aria-expanded="showAccSettings"
            aria-controls="accessibility-drawer"
            title="Paramètres d'accessibilité visuelle"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span class="btn-text">Accessibilité</span>
          </button>
        </div>
      </div>

      <!-- Collapsible Drawer for Accessibility Controls -->
      <div 
        id="accessibility-drawer" 
        class="accessibility-drawer" 
        :class="{ 'open': showAccSettings }"
        role="region"
        aria-label="Options d'accessibilité visuelle"
      >
        <div class="drawer-inner">
          <!-- Contrast Switcher -->
          <div class="control-section">
            <span class="control-label-text">Rendu :</span>
            <button 
              type="button" 
              class="control-btn contrast-btn"
              :class="{ 'active': isHighContrast }"
              @click="toggleContrast"
              :aria-pressed="isHighContrast"
              title="Activer le contraste renforcé"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 0 20Z" fill="currentColor" />
              </svg>
              <span>Contraste renforcé</span>
            </button>
          </div>

          <!-- Text Resizing Switcher -->
          <div class="control-section">
            <span class="control-label-text">Taille texte :</span>
            <div class="text-scale-group" role="group" aria-label="Taille du texte">
              <button 
                type="button" 
                class="control-btn"
                @click="adjustFont(-0.1)"
                :disabled="fontScale <= 0.8"
                aria-label="Diminuer la taille du texte"
              >
                A-
              </button>
              <button 
                type="button" 
                class="control-btn font-reset-btn"
                @click="resetFont"
                :disabled="fontScale === 1.0"
                aria-label="Réinitialiser la taille du texte"
              >
                100%
              </button>
              <button 
                type="button" 
                class="control-btn"
                @click="adjustFont(0.1)"
                :disabled="fontScale >= 1.6"
                aria-label="Augmenter la taille du texte"
              >
                A+
              </button>
            </div>
          </div>

          <!-- Motion reduction Switcher -->
          <div class="control-section">
            <span class="control-label-text">Effets visuels :</span>
            <button 
              type="button" 
              class="control-btn motion-btn"
              :class="{ 'active': reducedAnimations }"
              @click="toggleAnimations"
              :aria-pressed="reducedAnimations"
              title="Désactiver les animations visuelles"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Mouvement réduit</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main id="main-content" class="app-main" tabindex="-1">
      <CameraTest />
    </main>

    <!-- Footer -->
    <footer class="app-footer" role="contentinfo">
      <div class="footer-container">
        <p>&copy; 2026 Auralis. Conçu pour l'accessibilité universelle (RGAA / WCAG 2.2).</p>
        <div class="accessibility-status">
          <span class="badge success-badge">Conforme RGAA &amp; W3C (Contraste {{ isHighContrast ? 'AAA' : 'AA' }})</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import CameraTest from "./CameraTest.vue";

// Accessibility states loading from localStorage to preserve user settings
const isHighContrast = ref(false);
const fontScale = ref(1.0);
const reducedAnimations = ref(false);
const showAccSettings = ref(false);

function toggleContrast() {
  isHighContrast.value = !isHighContrast.value;
  localStorage.setItem("auralis-contrast", isHighContrast.value ? "true" : "false");
}

function adjustFont(step: number) {
  const nextScale = parseFloat((fontScale.value + step).toFixed(1));
  if (nextScale >= 0.8 && nextScale <= 1.6) {
    fontScale.value = nextScale;
    localStorage.setItem("auralis-fontscale", String(nextScale));
  }
}

function resetFont() {
  fontScale.value = 1.0;
  localStorage.setItem("auralis-fontscale", "1.0");
}

function toggleAnimations() {
  reducedAnimations.value = !reducedAnimations.value;
  localStorage.setItem("auralis-reduced-motion", reducedAnimations.value ? "true" : "false");
}

onMounted(() => {
  // Load preferences from local storage
  isHighContrast.value = localStorage.getItem("auralis-contrast") === "true";
  
  const savedScale = localStorage.getItem("auralis-fontscale");
  if (savedScale) {
    fontScale.value = parseFloat(savedScale);
  }
  
  reducedAnimations.value = localStorage.getItem("auralis-reduced-motion") === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Open accessibility settings by default on desktops, closed on mobiles to optimize space
  showAccSettings.value = window.innerWidth > 768;
});
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Header design: Modern obsidian styling */
.app-header {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 36px;
  height: 36px;
  color: var(--accent-primary-light);
}

.brand-text h1 {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.theme-high-contrast .brand-text h1 {
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  color: var(--text-primary);
}

.tagline {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: block;
  font-weight: 500;
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
}

/* Collapsible Accessibility Drawer */
.accessibility-drawer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.35s ease, padding-top 0.35s ease;
  background-color: var(--bg-secondary);
  border-top: 0 solid var(--border-color);
}

.accessibility-drawer.open {
  max-height: 300px;
  border-top: 1px solid var(--border-color);
  margin-top: 14px;
  padding-top: 14px;
}

.drawer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Accessibility Control Buttons */
.control-btn {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  min-height: 40px; /* Tap target */
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn:hover:not(:disabled) {
  background-color: var(--bg-surface-elevated);
  border-color: var(--text-secondary);
}

.control-btn.active {
  background-color: var(--accent-primary);
  color: #000000;
  border-color: var(--accent-primary);
}

.theme-high-contrast .control-btn.active {
  background-color: var(--accent-primary);
  color: #000000;
  border-color: #ffffff;
  outline: 2px solid #ffffff;
}

.text-scale-group {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.text-scale-group .control-btn {
  border: none;
  border-radius: 0;
  min-width: 38px;
  justify-content: center;
  padding: 8px;
}

.text-scale-group .control-btn:not(:last-child) {
  border-right: 1px solid var(--border-color);
}

/* Main Container Area */
.app-main {
  flex-grow: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 20px;
  outline: none; /* Skip-link target without visible ring */
}

/* Footer Section styling */
.app-footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 20px;
  margin-top: auto;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-round);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid currentColor;
}

.success-badge {
  background-color: var(--success-bg);
  color: var(--success);
}

.theme-high-contrast .success-badge {
  background-color: #000000;
  color: var(--success);
  border: 2px solid var(--success);
}

/* Responsiveness adjustments */
@media (max-width: 768px) {
  .header-container {
    flex-wrap: nowrap;
  }
  
  .brand-text h1 {
    font-size: 1.35rem;
  }
  
  .tagline {
    font-size: 0.7rem;
  }

  .toggle-settings-btn .btn-text {
    display: none; /* Hide button text to keep it extremely compact as an icon button on mobile */
  }

  .toggle-settings-btn {
    padding: 8px;
    min-width: 40px;
    justify-content: center;
  }

  .drawer-inner {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .control-section {
    justify-content: space-between;
    width: 100%;
  }

  .control-section .control-btn, 
  .control-section .text-scale-group {
    flex-grow: 1;
    max-width: 70%;
  }
  
  .text-scale-group .control-btn {
    max-width: none;
  }

  .app-main {
    padding: 16px 12px;
  }

  .footer-container {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .app-main {
    padding: 0; /* Full bleed layout on mobile: 0 horizontal margin for edge-to-edge camera feed */
  }
  
  .app-header {
    padding: 12px 14px;
  }

  .app-footer {
    padding: 24px 16px;
  }
}
</style>
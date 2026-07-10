<template>
  <div
    class="app-wrapper"
    :class="{
      'theme-high-contrast': isHighContrast,
      'no-animations': reducedAnimations,
    }"
    :style="{ '--font-scale': fontScale }"
  >
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>

    <header class="app-header" role="banner">
      <div class="header-container">
        <div class="brand" aria-label="Auralis">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path d="M12 3.5c4.9 0 8.9 3.5 10 8.2-1.1 4.7-5.1 8.2-10 8.2s-8.9-3.5-10-8.2c1.1-4.7 5.1-8.2 10-8.2Z" stroke="currentColor" stroke-width="1.8" />
              <circle cx="12" cy="11.7" r="3.2" fill="currentColor" />
            </svg>
          </span>
          <div class="brand-text">
            <h1>Auralis</h1>
            <p>Assistant visuel en direct</p>
          </div>
        </div>

        <button
          type="button"
          class="settings-button"
          :class="{ active: showAccSettings }"
          :aria-expanded="showAccSettings"
          aria-controls="accessibility-drawer"
          @click="showAccSettings = !showAccSettings"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 7h10" />
            <path d="M18 7h2" />
            <path d="M4 17h2" />
            <path d="M10 17h10" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="8" cy="17" r="2" />
          </svg>
          <span>Accessibilité</span>
        </button>
      </div>

      <div
        id="accessibility-drawer"
        class="accessibility-drawer"
        :class="{ open: showAccSettings }"
        role="region"
        aria-label="Options d'accessibilité visuelle"
      >
        <div class="drawer-inner">
          <button type="button" class="drawer-button" :class="{ active: isHighContrast }" :aria-pressed="isHighContrast" @click="toggleContrast">
            Contraste renforcé
          </button>

          <div class="font-controls" role="group" aria-label="Taille du texte">
            <button type="button" class="drawer-button square" :disabled="fontScale <= 0.8" aria-label="Diminuer la taille du texte" @click="adjustFont(-0.1)">
              A-
            </button>
            <button type="button" class="drawer-button reset" :disabled="fontScale === 1.0" aria-label="Réinitialiser la taille du texte" @click="resetFont">
              100%
            </button>
            <button type="button" class="drawer-button square" :disabled="fontScale >= 1.6" aria-label="Augmenter la taille du texte" @click="adjustFont(0.1)">
              A+
            </button>
          </div>

          <button type="button" class="drawer-button" :class="{ active: reducedAnimations }" :aria-pressed="reducedAnimations" @click="toggleAnimations">
            Mouvement réduit
          </button>
        </div>
      </div>
    </header>

    <main id="main-content" class="app-main" tabindex="-1">
      <CameraTest />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import CameraTest from "./CameraTest.vue";

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
  isHighContrast.value = localStorage.getItem("auralis-contrast") === "true";

  const savedScale = localStorage.getItem("auralis-fontscale");
  if (savedScale) {
    fontScale.value = parseFloat(savedScale);
  }

  reducedAnimations.value =
    localStorage.getItem("auralis-reduced-motion") === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  showAccSettings.value = window.innerWidth > 900;
});
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  color: var(--text-primary);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid rgba(219, 231, 238, 0.82);
  backdrop-filter: blur(18px);
}

.theme-high-contrast .app-header {
  background: #000000;
}

.header-container {
  width: min(1180px, calc(100% - 32px));
  min-height: 74px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}

.brand-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  color: #0f84c1;
  background: linear-gradient(135deg, #dff4ff 0%, #fff6dd 100%);
  border: 1px solid #cde8f6;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}

.brand-text h1 {
  font-size: 1.55rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0;
}

.brand-text p {
  margin-top: 0.22rem;
  color: var(--text-secondary);
  font-size: 0.86rem;
  font-weight: 650;
}

.settings-button,
.drawer-button {
  background: #ffffff;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.65rem 0.9rem;
  box-shadow: var(--shadow-sm);
}

.settings-button:hover,
.drawer-button:hover:not(:disabled) {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.settings-button.active,
.drawer-button.active {
  background: var(--text-primary);
  color: var(--bg-secondary);
  border-color: var(--text-primary);
}

.accessibility-drawer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.24s ease, padding 0.24s ease;
}

.accessibility-drawer.open {
  max-height: 120px;
  padding-bottom: 1rem;
}

.drawer-inner {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.font-controls {
  display: inline-flex;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.font-controls .drawer-button {
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.font-controls .drawer-button + .drawer-button {
  border-left: 1px solid var(--border-color);
}

.drawer-button.square {
  min-width: 46px;
}

.drawer-button.reset {
  min-width: 68px;
}

.app-main {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 26px 0 48px;
  outline: none;
}

@media (max-width: 760px) {
  .header-container,
  .drawer-inner,
  .app-main {
    width: min(100% - 24px, 1180px);
  }

  .header-container {
    min-height: 68px;
  }

  .brand-mark {
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }

  .brand-text h1 {
    font-size: 1.35rem;
  }

  .brand-text p {
    display: none;
  }

  .settings-button span {
    display: none;
  }

  .settings-button {
    width: 44px;
    padding: 0;
  }

  .drawer-inner {
    align-items: stretch;
  }

  .drawer-button {
    flex: 1 1 auto;
  }
}
</style>

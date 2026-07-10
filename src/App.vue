<template>
  <main id="main-content" class="app-shell" tabindex="-1">
    <CameraTest />
  </main>
</template>

<script setup lang="ts">
import CameraTest from "./CameraTest.vue";
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #05070b;
  outline: none;
}
</style>

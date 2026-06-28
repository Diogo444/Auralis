<template>
  <main>
    <video ref="videoRef" autoplay playsinline muted></video>
    <canvas ref="canvasRef" style="display: none"></canvas>

    <button @click="startCamera">Démarrer caméra</button>
    <button @click="sendFrame">Envoyer une image</button>

    <pre>{{ result }}</pre>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const result = ref("");

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  if (videoRef.value) {
    videoRef.value.srcObject = stream;
  }
}

async function sendFrame() {
  if (!videoRef.value || !canvasRef.value) return;

  const video = videoRef.value;
  const canvas = canvasRef.value;

  canvas.width = 512;
  canvas.height = Math.round((video.videoHeight / video.videoWidth) * 512);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  const imageBase64 = dataUrl.split(",")[1];

  const response = await fetch("http://localhost:3000/analyze-frame", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mission: "Préviens-moi quand la personne porte des lunettes",
      imageBase64,
      mimeType: "image/jpeg",
    }),
  });

  const data = await response.json();
  result.value = JSON.stringify(data, null, 2);
}
</script>
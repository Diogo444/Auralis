<template>
    <main>
        <video ref="videoRef" autoplay playsinline muted></video>
        <canvas ref="canvasRef" style="display: none"></canvas>

        <div>
            <button @click="startCamera">Démarrer caméra</button>
            <button @click="sendFrame">Envoyer une image</button>
            <button @click="startWatching" :disabled="watching">Démarrer surveillance</button>
            <button @click="stopWatching" :disabled="!watching">Arrêter surveillance</button>
            <label for="mission">Mission :</label>
            <input id="mission" v-model="mission" placeholder="Entrez la mission..." />
        </div>

        <p>
            État :
            <strong>{{ watching ? "surveillance active" : "arrêtée" }}</strong>
        </p>

        <pre>{{ result }}</pre>
    </main>
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
const mission = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const result = ref("");
const watching = ref(false);

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
    });

    if (videoRef.value) {
        videoRef.value.srcObject = stream;
    }
}

function speak(message: string) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonFromRaw(raw: string) {
    const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return JSON.parse(cleaned);
}

async function sendFrame(): Promise<AnalyzeResult | null> {
    if (!videoRef.value || !canvasRef.value) return null;

    const video = videoRef.value;
    const canvas = canvasRef.value;

    if (!video.videoWidth || !video.videoHeight) {
        result.value = "La caméra n'est pas encore prête.";
        return null;
    }

    canvas.width = 512;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 512);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const imageBase64 = dataUrl.split(",")[1];

    const response = await fetch("http://localhost:3000/analyze-frame", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            mission: mission.value ,
            imageBase64,
            mimeType: "image/jpeg",
        }),
    });

    const data = await response.json();

    let parsed: AnalyzeResult = data;

    if (typeof data.raw === "string") {
        try {
            parsed = extractJsonFromRaw(data.raw);
        } catch {
            parsed = data;
        }
    }

    result.value = JSON.stringify(parsed, null, 2);

    return parsed;
}

async function startWatching() {
    if (watching.value) return;

    watching.value = true;

    while (watching.value) {
        const analysis = await sendFrame();

        if (analysis?.matched) {
            speak(analysis.message ?? "Mission validée.");
            stopWatching();
            return;
        }

        await wait(1000);
    }
}

function stopWatching() {
    watching.value = false;
}
</script>
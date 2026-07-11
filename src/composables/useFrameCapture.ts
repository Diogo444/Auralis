const ANALYSIS_FRAME_WIDTH = 512;
const CHANGE_SAMPLE_SIZE = 32;
const FRAME_READY_TIMEOUT_MS = 3_000;

export type CapturedFrame = {
  image: Blob;
  captureMs: number;
  encodingMs: number;
  imageBytes: number;
};

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality = 0.65,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Impossible de generer l'image JPEG"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function captureFrameAsBlob(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<CapturedFrame> {
  await waitForFrame(video);

  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("La camera n'est pas prete.");
  }

  const captureStartedAt = performance.now();
  canvas.width = ANALYSIS_FRAME_WIDTH;
  canvas.height = Math.round(
    (video.videoHeight / video.videoWidth) * ANALYSIS_FRAME_WIDTH,
  );

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Le canvas de capture est indisponible.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const captureMs = performance.now() - captureStartedAt;

  const encodingStartedAt = performance.now();
  const image = await canvasToBlob(canvas);
  const encodingMs = performance.now() - encodingStartedAt;

  return {
    image,
    captureMs,
    encodingMs,
    imageBytes: image.size,
  };
}

function waitForFrame(video: HTMLVideoElement): Promise<void> {
  if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let timeoutId: number | null = null;

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
        cleanup();
        resolve();
      }
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("La camera n'est pas prete."));
    }, FRAME_READY_TIMEOUT_MS);

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    onReady();
  });
}

export function captureFrameSample(
  video: HTMLVideoElement,
): Uint8ClampedArray | null {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = CHANGE_SAMPLE_SIZE;
  canvas.height = CHANGE_SAMPLE_SIZE;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, CHANGE_SAMPLE_SIZE, CHANGE_SAMPLE_SIZE);
  return context.getImageData(0, 0, CHANGE_SAMPLE_SIZE, CHANGE_SAMPLE_SIZE).data;
}

export function calculateFrameDifference(
  previous: Uint8ClampedArray,
  current: Uint8ClampedArray,
): number {
  let totalDifference = 0;

  for (let index = 0; index < current.length; index += 4) {
    totalDifference += Math.abs((current[index] ?? 0) - (previous[index] ?? 0));
    totalDifference += Math.abs(
      (current[index + 1] ?? 0) - (previous[index + 1] ?? 0),
    );
    totalDifference += Math.abs(
      (current[index + 2] ?? 0) - (previous[index + 2] ?? 0),
    );
  }

  const channelCount = (current.length / 4) * 3;
  return totalDifference / channelCount / 255;
}

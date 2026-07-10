import { ref, type Ref } from "vue";

type UseCameraOptions = {
  videoRef: Ref<HTMLVideoElement | null>;
  announce: (message: string) => void;
};

export function useCamera({ videoRef, announce }: UseCameraOptions) {
  const cameraStream = ref<MediaStream | null>(null);
  const diagnosticLogs = ref<string[]>([]);
  const isSecure = ref(window.isSecureContext);
  const deviceList = ref<string[]>([]);
  const navigatorUserAgent = navigator.userAgent;

  function logDiagnostic(message: string) {
    const time = new Date().toTimeString().split(" ")[0] ?? "";
    diagnosticLogs.value.unshift(`[${time}] ${message}`);
    console.log(`[Diagnostic] ${message}`);
  }

  function clearDiagnosticLogs() {
    diagnosticLogs.value = [];
    logDiagnostic("Logs effaces.");
  }

  async function checkDevices() {
    logDiagnostic("Enumeration des peripheriques...");

    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        logDiagnostic("enumerateDevices n'est pas supporte par ce navigateur.");
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      deviceList.value = devices.map(
        (device) =>
          `${device.kind}: ${device.label || "Sans nom"} (id: ${
            device.deviceId ? `${device.deviceId.substring(0, 8)}...` : "inconnu"
          })`,
      );
      logDiagnostic(`Peripheriques trouves : ${devices.length}`);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      logDiagnostic(`Erreur enumeration peripheriques : ${details}`);
    }
  }

  async function startCamera() {
    logDiagnostic("Tentative d'activation de la camera...");
    logDiagnostic(`window.isSecureContext = ${window.isSecureContext}`);

    await checkDevices();

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    logDiagnostic(
      `Appel de getUserMedia avec contraintes : ${JSON.stringify(constraints)}`,
    );

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      cameraStream.value = stream;
      if (videoRef.value) {
        videoRef.value.srcObject = stream;
      }

      announce("Camera demarree avec succes.");
      logDiagnostic("Flux de la camera connecte avec succes au tag video.");
    } catch (error) {
      const errName = error instanceof Error ? error.name : "UnknownError";
      const errMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue.";
      const detailedMessage = `Erreur Camera:\nNom : ${errName}\nMessage : ${errMessage}\nContexte securise : ${window.isSecureContext}`;

      console.error("Echec de startCamera :", error);
      logDiagnostic(`[ECHEC] startCamera : ${errName} - ${errMessage}`);
      announce(`Echec de l'activation de la camera : ${errName}.`);
      alert(detailedMessage);
    }
  }

  function stopCamera() {
    if (cameraStream.value) {
      cameraStream.value.getTracks().forEach((track) => track.stop());
      cameraStream.value = null;
    }

    if (videoRef.value) {
      videoRef.value.srcObject = null;
    }

    announce("Camera desactivee.");
  }

  return {
    cameraStream,
    diagnosticLogs,
    isSecure,
    deviceList,
    navigatorUserAgent,
    logDiagnostic,
    clearDiagnosticLogs,
    checkDevices,
    startCamera,
    stopCamera,
  };
}

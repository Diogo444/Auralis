import { ref } from "vue";

export function useSpeech() {
  const ariaAnnouncement = ref("");
  const speakResults = ref(true);

  function announce(message: string) {
    ariaAnnouncement.value = message;
  }

  function speak(message: string) {
    if (!speakResults.value) {
      return;
    }

    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "fr-FR";
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Echec de la synthese vocale :", error);
    }
  }

  return {
    ariaAnnouncement,
    speakResults,
    announce,
    speak,
  };
}

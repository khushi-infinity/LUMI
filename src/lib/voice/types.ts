/**
 * Voice stack (spec §11/§44): the product never hard-codes a voice vendor.
 * Sarvam is primary (Indian languages, code-mixed speech); the browser's
 * Web Speech API is the always-available fallback.
 */
export interface VoiceProvider {
  readonly name: string;
  readonly supportsSTT: boolean;
  readonly supportsTTS: boolean;
  /** Begin listening; emits interim + final transcripts. */
  startListening(onTranscript: (text: string, final: boolean) => void): Promise<void>;
  stopListening(): void;
  /** Speak text aloud; resolves when finished. */
  speak(text: string): Promise<void>;
  stopSpeaking(): void;
}

export function isSpeechRecognitionAvailable(): boolean {
  return typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
}

import type { VoiceProvider } from "@/lib/voice/types";

/**
 * SarvamVoiceProvider — Indian-language STT/TTS (spec §11).
 *
 * Wire-up (when SARVAM_API_KEY is present):
 *   STT  → Sarvam Saaras (transcription / translation / code-mixed)
 *   TTS  → Sarvam Bulbul (streaming output for interactive latency)
 *
 * Both calls proxy through LUMI's own backend (/api/voice/stt, /api/voice/tts)
 * so the API key never reaches the browser (spec §63).
 */
export class SarvamVoiceProvider implements VoiceProvider {
  readonly name = "sarvam";
  readonly supportsSTT = true;
  readonly supportsTTS = true;
  private fallback: VoiceProvider;
  private recording: MediaRecorder | null = null;

  constructor(fallback: VoiceProvider) {
    this.fallback = fallback;
  }

  async startListening(onTranscript: (text: string, final: boolean) => void) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        // TODO(hackathon): POST the audio blob to /api/voice/stt with the
        // Sarvam Saaras model, then emit onTranscript(text, true).
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      this.recording = rec;
    } catch {
      // Mic unavailable → degrade gracefully to browser STT (spec §44).
      await this.fallback.startListening(onTranscript);
    }
  }

  stopListening() {
    this.recording?.stop();
    this.recording = null;
    this.fallback.stopListening();
  }

  async speak(text: string) {
    // TODO(hackathon): POST text to /api/voice/tts (Sarvam Bulbul streaming),
    // play the returned audio, and only fall back to browser TTS on failure.
    await this.fallback.speak(text);
  }

  stopSpeaking() {
    this.fallback.stopSpeaking();
  }
}

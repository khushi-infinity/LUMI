import type { VoiceProvider } from "@/lib/voice/types";

/**
 * SarvamVoiceProvider — Indian-language STT/TTS via LUMI's own backend
 * (/api/voice/stt, /api/voice/tts) so the API key never reaches the
 * browser (spec §63). STT is batch: it records while you talk and runs
 * Saarika when you stop, which is more accurate than streaming for
 * full questions. Every failure degrades to the browser provider (§44).
 */
export class SarvamVoiceProvider implements VoiceProvider {
  readonly name = "sarvam";
  readonly supportsSTT = true;
  readonly supportsTTS = true;
  private fallback: VoiceProvider;
  private recorder: MediaRecorder | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private onTranscriptCb: ((text: string, final: boolean) => void) | null = null;

  constructor(fallback: VoiceProvider) {
    this.fallback = fallback;
  }

  async startListening(onTranscript: (text: string, final: boolean) => void) {
    this.onTranscriptCb = onTranscript;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        void this.fallback.startListening(onTranscript);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 2000) return; // noise gate: too short to be a question
        try {
          const fd = new FormData();
          fd.append("audio", blob, "speech.webm");
          const res = await fetch("/api/voice/stt", { method: "POST", body: fd });
          if (!res.ok) throw new Error(`stt ${res.status}`);
          const data = (await res.json()) as { transcript?: string };
          if (data.transcript) onTranscript(data.transcript, true);
        } catch {
          // degrade to browser STT for this utterance
          try {
            await this.fallback.startListening(onTranscript);
            // immediately stop browser listening; caller drives start/stop
            // cycles, Sarvam handles the final pass on the next utterance.
          } catch {
            /* nothing more we can do */
          }
        }
      };
      rec.start();
      this.recorder = rec;
    } catch {
      await this.fallback.startListening(onTranscript);
    }
  }

  stopListening() {
    this.recorder?.state === "recording" && this.recorder.stop();
    this.recorder = null;
    this.fallback.stopListening();
  }

  async speak(text: string) {
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 1400), languageCode: "en-IN" }),
      });
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const data = (await res.json()) as { audioBase64?: string };
      if (!data.audioBase64) throw new Error("no audio");
      await new Promise<void>((resolve) => {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
        this.currentAudio = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        void audio.play();
      });
      this.currentAudio = null;
    } catch {
      await this.fallback.speak(text);
    }
  }

  stopSpeaking() {
    this.currentAudio?.pause();
    this.currentAudio = null;
    this.fallback.stopSpeaking();
  }
}

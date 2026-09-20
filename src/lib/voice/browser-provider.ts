import type { VoiceProvider } from "@/lib/voice/types";

/** BrowserVoiceProvider — zero-dependency fallback via Web Speech API. */
export class BrowserVoiceProvider implements VoiceProvider {
  readonly name = "browser";
  readonly supportsSTT = true;
  readonly supportsTTS = true;
  private recognition: { stop: () => void; abort: () => void } | null = null;

  async startListening(onTranscript: (text: string, final: boolean) => void) {
    if (typeof window === "undefined") throw new Error("No window");
    const Ctor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!Ctor) throw new Error("SpeechRecognition unavailable");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (Ctor as any)();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: {
      resultIndex: number;
      results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
    }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        onTranscript(r[0].transcript, r.isFinal);
      }
    };
    rec.start();
    this.recognition = rec;
  }

  stopListening() {
    this.recognition?.stop();
    this.recognition = null;
  }

  async speak(text: string) {
    if (typeof speechSynthesis === "undefined") return;
    return new Promise<void>((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.02;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      speechSynthesis.speak(utter);
    });
  }

  stopSpeaking() {
    speechSynthesis?.cancel();
  }
}

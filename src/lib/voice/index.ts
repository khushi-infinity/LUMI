import { BrowserVoiceProvider } from "@/lib/voice/browser-provider";
import { SarvamVoiceProvider } from "@/lib/voice/sarvam-provider";
import type { VoiceProvider } from "@/lib/voice/types";
import { isSpeechRecognitionAvailable } from "@/lib/voice/types";

/**
 * VoiceService (spec §44): Sarvam → primary, Browser Speech → fallback.
 * The app never crashes because one external API is unavailable.
 */
export function getVoiceProvider(): VoiceProvider {
  if (typeof window === "undefined") {
    return new BrowserVoiceProvider();
  }
  if (isSpeechRecognitionAvailable()) {
    const browser = new BrowserVoiceProvider();
    return process.env.NEXT_PUBLIC_SARVAM_ENABLED === "true"
      ? new SarvamVoiceProvider(browser)
      : browser;
  }
  return new BrowserVoiceProvider();
}

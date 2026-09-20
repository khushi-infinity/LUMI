import { BrowserVoiceProvider } from "@/lib/voice/browser-provider";
import { SarvamVoiceProvider } from "@/lib/voice/sarvam-provider";
import type { VoiceProvider } from "@/lib/voice/types";

/**
 * VoiceService (spec §44): Sarvam via backend proxy when the key exists,
 * Web Speech API otherwise. The routes return 501 without a key and the
 * Sarvam provider degrades to browser speech per-call, so the app never
 * crashes because one external API is unavailable.
 */
export function getVoiceProvider(): VoiceProvider {
  const browser = new BrowserVoiceProvider();
  return new SarvamVoiceProvider(browser);
}

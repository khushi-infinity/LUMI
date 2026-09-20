"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import Mascot from "@/components/mascot/Mascot";
import { Card } from "@/components/ui";
import { getVoiceProvider } from "@/lib/voice";
import type { VoiceProvider } from "@/lib/voice/types";

/**
 * Live Tutor (spec §9–10): a real-time digital human.
 *
 * Integration shape (env-gated; the page works without any keys):
 *   Student voice → VoiceProvider (Sarvam → fallback: Web Speech)
 *   → AI agent (tutor/chat with memory context)
 *   → voice reply (TTS)
 *   → Beyond Presence avatar stream over LiveKit
 *
 * When BEY_API_KEY + LIVEKIT_URL exist, mount the LiveKit room here and
 * render <VideoTrack> instead of the 2D mascot placeholder.
 */
export default function LivePage() {
  const [connected, setConnected] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<
    { who: "you" | "lumi"; text: string }[]
  >([]);
  const [interim, setInterim] = useState("");
  const voice = useRef<VoiceProvider | null>(null);

  useEffect(() => {
    voice.current = getVoiceProvider();
    return () => {
      voice.current?.stopListening();
      voice.current?.stopSpeaking();
    };
  }, []);

  async function connect() {
    setConnected(true);
    setTranscript([
      {
        who: "lumi",
        text: "Hi! I'm Lumi, your live tutor. What are we learning today?",
      },
    ]);
    await speak(
      "Hi! I'm Lumi, your live tutor. What are we learning today?",
    );
  }

  function hangup() {
    voice.current?.stopListening();
    voice.current?.stopSpeaking();
    setListening(false);
    setSpeaking(false);
    setConnected(false);
  }

  async function speak(text: string) {
    setSpeaking(true);
    await voice.current?.speak(text);
    setSpeaking(false);
  }

  async function toggleMic() {
    const v = voice.current;
    if (!v) return;
    if (listening) {
      v.stopListening();
      setListening(false);
      setInterim("");
      return;
    }
    setListening(true);
    try {
      await v.startListening((text, final) => {
        if (final) {
          setInterim("");
          void handleUserUtterance(text);
        } else {
          setInterim(text);
        }
      });
    } catch {
      setListening(false);
      setTranscript((t) => [
        ...t,
        { who: "lumi", text: "I couldn't access your microphone. Check browser permissions." },
      ]);
    }
  }

  async function handleUserUtterance(text: string) {
    setTranscript((t) => [...t, { who: "you", text }]);
    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: "simple",
          context: "Live voice session with the digital-human tutor.",
        }),
      });
      const data = (await res.json()) as { reply?: string };
      const reply = data.reply ?? "Sorry, I lost that one: say it again?";
      setTranscript((t) => [...t, { who: "lumi", text: reply }]);
      await speak(reply.replace(/[*`#]/g, "").slice(0, 600));
    } catch {
      setTranscript((t) => [
        ...t,
        { who: "lumi", text: "Connection hiccup: let's try that again." },
      ]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-sm">Live Tutor</h1>
        <p className="font-bold text-white/75">
          Talk to Lumi like a real tutor: interrupt, ask, think out loud.
        </p>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-navy to-[#1e3a6e] p-8 text-white">
        {/* Avatar stage */}
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
          {connected ? (
            <>
              {/* TODO: replace with Beyond Presence avatar <video> via LiveKit */}
              <Mascot
                thinking={speaking}
                className="h-56 w-56 drop-shadow-2xl"
              />
              <p className="flex items-center gap-2 text-sm font-bold text-white/70">
                {speaking ? (
                  <>
                    <Volume2 className="h-4 w-4 animate-pulse" /> Lumi is speaking…
                  </>
                ) : listening ? (
                  "Listening… speak freely"
                ) : (
                  "Tap the mic to talk"
                )}
              </p>
            </>
          ) : (
            <div className="text-center">
              <p className="text-6xl">🪄</p>
              <p className="mt-4 max-w-md font-bold text-white/80">
                A real-time digital human who can see your material, hear your
                questions, and teach out loud.
              </p>
              <button onClick={connect} className="btn-primary mt-6 text-lg">
                Start session
              </button>
            </div>
          )}
        </div>

        {connected ? (
          <div className="absolute right-6 top-6 flex gap-3">
            <button
              onClick={toggleMic}
              aria-label={listening ? "Mute" : "Unmute"}
              className={`grid h-12 w-12 place-items-center rounded-full transition-colors ${
                listening ? "bg-coral text-white" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {listening ? <Mic /> : <MicOff />}
            </button>
            <button
              onClick={hangup}
              aria-label="End session"
              className="grid h-12 w-12 place-items-center rounded-full bg-rose-low text-white transition-transform hover:scale-105"
            >
              <PhoneOff />
            </button>
          </div>
        ) : null}
      </Card>

      {connected ? (
        <Card>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-navy/50">
            Live transcript
          </p>
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {transcript.map((t, i) => (
              <p
                key={i}
                className={`font-semibold ${
                  t.who === "you" ? "text-right text-navy/80" : "text-navy"
                }`}
              >
                <span className="mr-2 text-xs font-extrabold uppercase text-navy/40">
                  {t.who === "you" ? "You" : "Lumi"}
                </span>
                {t.text}
              </p>
            ))}
            {interim ? (
              <p className="text-right font-semibold italic text-navy/40">
                {interim}…
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

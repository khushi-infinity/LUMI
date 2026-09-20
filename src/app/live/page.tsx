"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import Mascot from "@/components/mascot/Mascot";
import { Card } from "@/components/ui";
import { getVoiceProvider } from "@/lib/voice";
import type { VoiceProvider } from "@/lib/voice/types";
import type { Room } from "livekit-client";

type AvatarState = "off" | "connecting" | "live" | "fallback";

/**
 * Live Tutor (spec §9–10): a real-time digital human.
 *
 * Student voice → VoiceProvider (Sarvam → browser fallback)
 *   → AI agent (/api/tutor/chat with memory context)
 *   → spoken reply (Sarvam TTS)
 *
 * Avatar: POST /api/live/session asks our backend to start a Beyond
 * Presence worker that joins a private LiveKit room and renders the
 * digital human. The browser connects with a scoped token and displays
 * the video. Without the LIVEKIT and BEY env vars the mascot stands in.
 */
export default function LivePage() {
  const [connected, setConnected] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [avatar, setAvatar] = useState<AvatarState>("off");
  const [transcript, setTranscript] = useState<{ who: "you" | "lumi"; text: string }[]>([]);
  const [interim, setInterim] = useState("");
  const voice = useRef<VoiceProvider | null>(null);
  const room = useRef<Room | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    voice.current = getVoiceProvider();
    return () => {
      voice.current?.stopListening();
      voice.current?.stopSpeaking();
      room.current?.disconnect();
      room.current = null;
    };
  }, []);

  async function startAvatarSession(): Promise<boolean> {
    setAvatar("connecting");
    try {
      const res = await fetch("/api/live/session", { method: "POST" });
      if (!res.ok) throw new Error(`session ${res.status}`);
      const data = (await res.json()) as {
        livekitUrl: string;
        clientToken: string;
      };
      const { Room, createLocalAudioTrack, Track } = await import("livekit-client");
      const r = new Room({ adaptiveStream: true, dynacast: true });
      await r.connect(data.livekitUrl, data.clientToken);
      room.current = r;

      // Publish a silent mic-side audio track so the avatar worker has a
      // publishing peer; real lip-sync audio piping lands with the demo build.
      try {
        const track = await createLocalAudioTrack();
        await r.localParticipant.publishTrack(track);
      } catch {
        /* mic-less devices still get video */
      }

      r.on("trackSubscribed", (t, pub) => {
        if (t.kind === Track.Kind.Video && videoRef.current) {
          t.attach(videoRef.current);
          setAvatar("live");
          void pub;
        }
      });
      // give the worker a few seconds to publish
      setTimeout(() => {
        setAvatar((s) => (s === "live" ? s : "fallback"));
      }, 8000);
      return true;
    } catch {
      setAvatar("fallback");
      return false;
    }
  }

  async function connect() {
    setConnected(true);
    setTranscript([
      { who: "lumi", text: "Hi! I'm Lumi, your live tutor. What are we learning today?" },
    ]);
    void startAvatarSession();
    await speak("Hi! I'm Lumi, your live tutor. What are we learning today?");
  }

  function hangup() {
    voice.current?.stopListening();
    voice.current?.stopSpeaking();
    room.current?.disconnect();
    room.current = null;
    setListening(false);
    setSpeaking(false);
    setConnected(false);
    setAvatar("off");
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
      const reply = data.reply ?? "Sorry, I lost that one, say it again?";
      setTranscript((t) => [...t, { who: "lumi", text: reply }]);
      await speak(reply.replace(/[*`#>]/g, "").slice(0, 600));
    } catch {
      setTranscript((t) => [
        ...t,
        { who: "lumi", text: "Connection hiccup, let's try that again." },
      ]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-sm">
          Live Tutor
        </h1>
        <p className="font-bold text-white/75">
          Talk to Lumi like a real tutor: interrupt, ask, think out loud.
        </p>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-navy to-[#1e3a6e] p-8 text-white">
        {/* Avatar stage: real video when the Bey session is live, mascot otherwise */}
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
          {connected ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`h-64 w-64 rounded-3xl object-cover shadow-2xl ${
                  avatar === "live" ? "" : "hidden"
                }`}
              />
              {avatar !== "live" ? (
                <Mascot thinking={speaking} className="h-56 w-56 drop-shadow-2xl" />
              ) : null}
              {avatar === "connecting" ? (
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Waking up your digital human…
                </p>
              ) : null}
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
                listening
                  ? "bg-coral text-white"
                  : "bg-white/20 text-white hover:bg-white/30"
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
              <p className="text-right font-semibold italic text-navy/40">{interim}…</p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

import { NextResponse } from "next/server";

/**
 * POST /api/voice/tts — Sarvam Bulbul text-to-speech, proxied so the API key
 * never reaches the browser (spec §63). Returns base64 mp3.
 */
export async function POST(req: Request) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "SARVAM_API_KEY not configured" }, { status: 501 });
  }
  try {
    const body = (await req.json()) as {
      text?: string;
      languageCode?: string;
      speaker?: string;
    };
    const text = (body.text ?? "").slice(0, 1500);
    if (!text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        language_code: body.languageCode ?? "en-IN",
        speaker: body.speaker ?? "shubh",
        model: "bulbul:v3",
        output_audio_codec: "mp3",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("sarvam tts error", res.status, detail.slice(0, 200));
      return NextResponse.json({ error: "tts failed" }, { status: 502 });
    }

    const json = (await res.json()) as { audios?: string[] };
    const audio = json.audios?.[0];
    if (!audio) {
      return NextResponse.json({ error: "no audio returned" }, { status: 502 });
    }
    return NextResponse.json({ audioBase64: audio, mimeType: "audio/mpeg" });
  } catch (err) {
    console.error("voice/tts failed", err);
    return NextResponse.json({ error: "tts failed" }, { status: 500 });
  }
}

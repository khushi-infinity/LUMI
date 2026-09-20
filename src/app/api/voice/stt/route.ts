import { NextResponse } from "next/server";

/**
 * POST /api/voice/stt — Sarvam Saarika speech-to-text, proxied so the API key
 * never reaches the browser (spec §63). Accepts multipart audio, returns transcript.
 */
export async function POST(req: Request) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "SARVAM_API_KEY not configured" }, { status: 501 });
  }
  try {
    const form = await req.formData();
    const entry = form.get("audio");
    if (!(entry instanceof Blob)) {
      return NextResponse.json({ error: "audio file is required" }, { status: 400 });
    }
    const fileBlob: Blob = entry;

    async function transcribe(model: string): Promise<Response> {
      const out = new FormData();
      out.append(
        "file",
        new File([fileBlob], "speech.webm", { type: fileBlob.type || "audio/webm" }),
      );
      out.append("model", model);
      return fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: { "api-subscription-key": key! },
        body: out,
      });
    }

    // saarika:v2.5 is current; fall back to v2 if the account lacks it.
    let res = await transcribe("saarika:v2.5");
    if (res.status === 400 || res.status === 422) {
      res = await transcribe("saarika:v2");
    }

    if (!res.ok) {
      const detail = await res.text();
      console.error("sarvam stt error", res.status, detail.slice(0, 200));
      return NextResponse.json({ error: "stt failed" }, { status: 502 });
    }

    const json = (await res.json()) as { transcript?: string };
    return NextResponse.json({ transcript: json.transcript ?? "" });
  } catch (err) {
    console.error("voice/stt failed", err);
    return NextResponse.json({ error: "stt failed" }, { status: 500 });
  }
}
